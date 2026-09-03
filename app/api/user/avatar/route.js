import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // KYC lock check
    const lock = process.env.KYC_LOCK_EDIT_AFTER_VERIFIED !== 'false';
    if (lock) {
      const u = await query('SELECT kyc_verified FROM users WHERE id=$1', [session.userId]);
      if (u.length && u[0].kyc_verified) return NextResponse.json({ error: 'Profile editing is locked after KYC verification. Contact support to update.' }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get('avatar');
    const url = form.get('avatar_url');

    let avatarUrl = null;

    if (file && typeof file === 'object' && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large — max 5MB' }, { status: 400 });
      const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
      if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Only JPG/PNG/WebP/GIF allowed' }, { status: 400 });
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.type.split('/')[1] || 'png';
      const dir = path.join(process.cwd(), 'public', 'avatars');
      await mkdir(dir, { recursive: true });
      const filename = `${session.userId}-${Date.now()}.${ext}`;
      const filepath = path.join(dir, filename);
      await writeFile(filepath, buffer);
      avatarUrl = `/avatars/${filename}`;
    } else if (url && typeof url === 'string' && url.trim()) {
      if (!url.startsWith('http') && !url.startsWith('data:image')) return NextResponse.json({ error: 'Invalid URL — must be http(s) or data:image' }, { status: 400 });
      // If data URL, ensure not too large
      if (url.length > 2_000_000) return NextResponse.json({ error: 'Image data too large' }, { status: 400 });
      avatarUrl = url.trim();
    } else {
      return NextResponse.json({ error: 'No file or url provided' }, { status: 400 });
    }

    await query('UPDATE users SET avatar_url=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [avatarUrl, session.userId]);
    try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [session.userId, 'Avatar Updated', 'Your profile picture was updated.', 'success']); } catch {}
    return NextResponse.json({ success: true, avatar_url: avatarUrl });
  } catch (e) {
    console.error('avatar upload', e);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
