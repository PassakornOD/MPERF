import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { pg_id, pg_name, hostgroup_ids } = await req.json();
  const connection = await pool.getConnection();
  try {
    // Security check for sysadmin
    if (user.role === 'sysadmin') {
        const [access]: any = await connection.query(`
            SELECT 1 FROM permission_groups pg
            LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id
            LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
            WHERE pg.pg_id = ? AND (pg.created_by = ? OR uug.user_id = ?)
        `, [pg_id, user.id, user.id]);

        if (access.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Forbidden: You do not have permission to update this group' }, { status: 403 });
        }
    }

    await connection.beginTransaction();

    if (pg_name !== undefined) {
      await connection.query('UPDATE permission_groups SET pg_name = ? WHERE pg_id = ?', [pg_name, pg_id]);
    }

    if (hostgroup_ids !== undefined) {
      await connection.query('DELETE FROM pg_hostgroups WHERE pg_id = ?', [pg_id]);
      if (hostgroup_ids.length > 0) {
        try {
          await connection.query('INSERT INTO pg_hostgroups (pg_id, hostgroup_id) VALUES ?', [hostgroup_ids.map((id: number) => [pg_id, id])]);
        } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') {
              throw new Error('One of the selected hostgroups is already assigned to another permission group.');
          }
          throw err;
        }
      }
    }

    await connection.commit();
    connection.release();
    return NextResponse.json({ message: 'Update successful' });
  } catch (err: any) { 
    await connection.rollback(); 
    connection.release();
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 400 }); 
  }
}
