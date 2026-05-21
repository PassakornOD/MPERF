import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user_id, group_ids, type } = await req.json(); // type: 'user_to_group' or 'group_to_pg'
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (type === 'user_to_group') {
        await connection.query('DELETE FROM user_to_user_groups WHERE user_id = ?', [user_id]);
        if (group_ids.length > 0) await connection.query('INSERT INTO user_to_user_groups (user_id, ug_id) VALUES ?', [group_ids.map((id: number) => [user_id, id])]);
    } else {
        await connection.query('DELETE FROM ug_permission_groups WHERE ug_id = ?', [user_id]); // user_id here acts as ug_id for mapping
        if (group_ids.length > 0) await connection.query('INSERT INTO ug_permission_groups (ug_id, pg_id) VALUES ?', [group_ids.map((id: number) => [user_id, id])]);
    }
    await connection.commit();
    return NextResponse.json({ message: 'Success' });
  } catch (err) { await connection.rollback(); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
  finally { connection.release(); }
}
