import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

async function ensureNotificationsTable() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, type VARCHAR(50) DEFAULT 'info', is_read BOOLEAN DEFAULT FALSE, link VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    await query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)');
  } catch {}
}

export async function GET(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    try {
      if (unreadOnly) {
        const res = await query('SELECT COUNT(*)::int as count FROM notifications WHERE user_id=$1 AND is_read=false', [session.userId]);
        return NextResponse.json({ count: res[0]?.count || 0 });
      }
      const notes = await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [session.userId]);
      const unread = await query('SELECT COUNT(*)::int as count FROM notifications WHERE user_id=$1 AND is_read=false', [session.userId]);
      return NextResponse.json({ notifications: notes, unreadCount: unread[0]?.count || 0 });
    } catch (e) {
      if (String(e.message).includes('does not exist') || e.code === '42P01' || e.code === '42703') {
        await ensureNotificationsTable();
        return NextResponse.json({ notifications: [], unreadCount: 0, count: 0 });
      }
      throw e;
    }
  } catch (e) {
    console.error('notifications GET', e);
    return NextResponse.json({ error: 'Failed', notifications: [], count: 0, unreadCount: 0 }, { status: 200 });
  }
}

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { action, id } = await req.json();
    if (action === 'markAllRead') {
      await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [session.userId]);
      return NextResponse.json({ success: true });
    }
    if (action === 'markRead' && id) {
      await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [id, session.userId]);
      return NextResponse.json({ success: true });
    }
    if (action === 'delete' && id) {
      await query('DELETE FROM notifications WHERE id=$1 AND user_id=$2', [id, session.userId]);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    console.error('notifications POST', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Helper to create notification (used internally)
export async function createNotification(userId, title, message, type='info', link=null) {
  try {
    await query('INSERT INTO notifications (user_id,title,message,type,link) VALUES ($1,$2,$3,$4,$5)', [userId,title,message,type,link]);
  } catch(e){ console.error('createNotification failed', e); }
}
