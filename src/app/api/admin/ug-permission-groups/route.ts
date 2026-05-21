import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM ug_permission_groups');
    return NextResponse.json(rows);
  } catch (err) { 
    console.error('Fetch ug-permission-groups Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 }); 
  }
}
