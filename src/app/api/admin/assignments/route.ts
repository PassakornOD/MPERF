import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const [users]: any = await pool.query('SELECT user_id, username FROM user');
    const [pgs]: any = await pool.query('SELECT pg_id, pg_name FROM permission_groups');
    const [assignments]: any = await pool.query('SELECT * FROM user_permission_groups');
    return NextResponse.json({ users, pgs, assignments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { user_id, pg_ids } = await req.json();
    
    // Check permission: Admin can edit any, Sysadmin can edit own
    if (user.role !== 'admin' && String(user.id) !== String(user_id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query('DELETE FROM user_permission_groups WHERE user_id = ?', [user_id]);
    if (pg_ids && pg_ids.length > 0) {
      const values = pg_ids.map((pgId: number) => [user_id, pgId]);
      await connection.query('INSERT INTO user_permission_groups (user_id, pg_id) VALUES ?', [values]);
    }
    await connection.commit();
    connection.release();
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    console.error('Assignment Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
