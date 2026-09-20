import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    // Ensure columns exist on deposits table
    try {
      await query('ALTER TABLE deposits ADD COLUMN IF NOT EXISTS proof_url TEXT DEFAULT NULL');
      await query('ALTER TABLE deposits ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(255) DEFAULT NULL');
      await query('ALTER TABLE deposits ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL');
    } catch {}

    const contentType = req.headers.get('content-type') || '';
    let depositId = null;
    let amount = null;
    let paymentMethod = 'crypto';
    let txHash = null;
    let notes = null;
    let proofUrl = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      depositId = formData.get('deposit_id') || formData.get('depositId');
      amount = formData.get('amount');
      paymentMethod = formData.get('paymentMethod') || formData.get('payment') || 'crypto';
      txHash = formData.get('tx_hash') || formData.get('txHash');
      notes = formData.get('notes');

      const file = formData.get('file') || formData.get('proof');
      const directUrl = formData.get('proof_url') || formData.get('proofUrl');

      if (file && typeof file === 'object' && file.size > 0) {
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'Proof file too large — max 10MB' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid file format. Please upload JPG, PNG, WebP, GIF, or PDF.' }, { status: 400 });
        }

        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          let ext = 'png';
          if (file.type === 'application/pdf') ext = 'pdf';
          else if (file.type.includes('jpeg')) ext = 'jpg';
          else if (file.type.includes('webp')) ext = 'webp';
          else if (file.type.includes('gif')) ext = 'gif';

          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'deposits');
          await mkdir(uploadDir, { recursive: true });

          const filename = `proof-${userId}-${depositId || Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
          const filepath = path.join(uploadDir, filename);
          await writeFile(filepath, buffer);
          proofUrl = `/uploads/deposits/${filename}`;
        } catch (fileErr) {
          console.error('File write error, fallback to data URL:', fileErr);
          // Fallback to data URL if filesystem is read-only (e.g. serverless)
          const bytes = await file.arrayBuffer();
          const base64 = Buffer.from(bytes).toString('base64');
          proofUrl = `data:${file.type};base64,${base64}`;
        }
      } else if (directUrl && typeof directUrl === 'string') {
        proofUrl = directUrl.trim();
      }
    } else {
      const body = await req.json().catch(() => ({}));
      depositId = body.deposit_id || body.depositId;
      amount = body.amount;
      paymentMethod = body.paymentMethod || body.payment || 'crypto';
      txHash = body.tx_hash || body.txHash;
      notes = body.notes;
      proofUrl = body.proof_url || body.proofUrl || body.proof;
    }

    if (!proofUrl && !txHash) {
      return NextResponse.json({ error: 'Please provide proof of payment (file or image) or transaction hash' }, { status: 400 });
    }

    let depositRecord = null;

    if (depositId) {
      // Attach proof to existing deposit
      const existing = await query('SELECT * FROM deposits WHERE id = $1 AND user_id = $2', [depositId, userId]);
      if (!existing.length) {
        return NextResponse.json({ error: 'Deposit record not found' }, { status: 404 });
      }

      const updated = await query(
        `UPDATE deposits 
         SET proof_url = COALESCE($1, proof_url), 
             tx_hash = COALESCE($2, tx_hash), 
             notes = COALESCE($3, notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND user_id = $5 
         RETURNING *`,
        [proofUrl, txHash || null, notes || null, depositId, userId]
      );
      depositRecord = updated[0];
    } else {
      // Create new pending deposit with proof attached
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) {
        return NextResponse.json({ error: 'Please specify the deposit amount' }, { status: 400 });
      }

      const reference = `DEP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const idemKey = `proof_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const inserted = await query(
        `INSERT INTO deposits (user_id, amount, type, payment, reference, status, proof_url, tx_hash, notes, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [userId, amt, 'deposit', paymentMethod, reference, 'pending', proofUrl, txHash || null, notes || null, idemKey]
      );
      depositRecord = inserted[0];
    }

    // Real-time notifications
    try {
      await query(
        'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
          'Proof of Payment Submitted',
          `Your payment proof for $${Number(depositRecord.amount).toFixed(2)} (Ref: ${depositRecord.reference}) has been submitted. Our team is verifying your payment.`,
          'info',
          '/deposit'
        ]
      );
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Proof of payment submitted successfully. Your deposit will be credited once confirmed.',
      deposit: depositRecord,
      proof_url: proofUrl,
    });
  } catch (error) {
    console.error('Deposit proof upload error:', error);
    return NextResponse.json({ error: 'Failed to upload proof of payment' }, { status: 500 });
  }
}
