import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { pg_id, hostgroup_id } = await req.json();
    await pool.query('DELETE FROM pg_hostgroups WHERE pg_id = ? AND hostgroup_id = ?', [pg_id, hostgroup_id]);
    return NextResponse.json({ message: 'Hostgroup removed from permission group' });
  } catch (err) { return NextResponse.json({ error: 'Failed to remove' }, { status: 500 }); }
}
