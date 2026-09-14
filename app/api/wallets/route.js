import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import WALLETS from '@/lib/wallets';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallets = Object.values(WALLETS).map(w => ({
      id: w.id,
      name: w.name,
      icon: w.icon,
      color: w.color,
      network: w.network,
      address: w.address,
    }));

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error('Wallets fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}
