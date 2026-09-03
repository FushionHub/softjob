import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tickets = await query('SELECT * FROM support_tickets WHERE user_id=$1 ORDER BY created_at DESC', [session.userId]).catch(()=>[]);
    return NextResponse.json({ tickets });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { subject, message, category } = await req.json();
    if (!subject || !message) return NextResponse.json({ error: 'Subject and message required' }, { status: 400 });
    const res = await query('INSERT INTO support_tickets (user_id, subject, message, category, status) VALUES ($1,$2,$3,$4,$5) RETURNING id', [session.userId, subject, message, category||'general', 'open']);
    try { await query('INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)', [session.userId, 'Support Ticket Created', `Your ticket #${res[0].id} has been opened.`, 'info']); } catch {}
    return NextResponse.json({ success:true, id: res[0].id, message:'Ticket created' });
  } catch (e) {
    console.error('support POST', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
