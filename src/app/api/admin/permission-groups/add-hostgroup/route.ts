import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { pg_id, hostgroup_ids } = await req.json();
    if (!pg_id || !hostgroup_ids || hostgroup_ids.length === 0) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    
    await pool.query('INSERT INTO pg_hostgroups (pg_id, hostgroup_id) VALUES ?', [hostgroup_ids.map((id: number) => [pg_id, id])]);
    return NextResponse.json({ message: 'Hostgroups added successfully' });
  } catch (err: any) { 
    if (err.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Some hostgroups are already assigned.' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 }); 
  }
}
