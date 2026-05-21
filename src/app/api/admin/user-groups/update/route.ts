import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const PROTECTED_GROUPS = ['admin', 'sysadmin', 'operation'];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { ug_id, ug_name, member_ids, pg_ids } = await req.json();
    const connection = await pool.getConnection();

    // Check if group is protected
    const [group]: any = await connection.query('SELECT ug_name FROM user_groups WHERE ug_id = ?', [ug_id]);
    if (group.length > 0) {
        if (user.role !== 'admin' && PROTECTED_GROUPS.includes(group[0].ug_name.toLowerCase())) {
            connection.release();
            return NextResponse.json({ error: 'Forbidden: Cannot update protected groups' }, { status: 403 });
        }
    }

    await connection.beginTransaction();

    if (ug_name !== undefined) {
      // Prevent renaming to a protected name
      if (user.role !== 'admin' && PROTECTED_GROUPS.includes(ug_name.toLowerCase())) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({ error: 'Forbidden: Cannot use protected name' }, { status: 403 });
      }
      await connection.query('UPDATE user_groups SET ug_name = ? WHERE ug_id = ?', [ug_name, ug_id]);
    }

    if (member_ids !== undefined) {
      await connection.query('DELETE FROM user_to_user_groups WHERE ug_id = ?', [ug_id]);
      if (member_ids.length > 0) {
        await connection.query('INSERT INTO user_to_user_groups (user_id, ug_id) VALUES ?', [member_ids.map((id: number) => [id, ug_id])]);
      }
    }

    if (pg_ids !== undefined) {
      await connection.query('DELETE FROM ug_permission_groups WHERE ug_id = ?', [ug_id]);
      if (pg_ids.length > 0) {
        await connection.query('INSERT INTO ug_permission_groups (ug_id, pg_id) VALUES ?', [pg_ids.map((id: number) => [ug_id, id])]);
      }
    }

    await connection.commit();
    connection.release();
    return NextResponse.json({ message: 'Update successful' });
  } catch (err) { 
    console.error('Update Group Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 }); 
  }
}
