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
    let pgQuery = 'SELECT * FROM permission_groups';
    let pghQuery = 'SELECT * FROM pg_hostgroups';
    const params: any[] = [];

    if (user.role === 'sysadmin') {
      // sysadmin sees:
      // 1. Groups they created
      // 2. Groups mapped to user groups they belong to
      pgQuery = `
        SELECT DISTINCT pg.* FROM permission_groups pg
        LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id
        LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
        WHERE pg.created_by = ? OR uug.user_id = ?
      `;
      params.push(user.id, user.id);

      pghQuery = `
        SELECT pgh.* FROM pg_hostgroups pgh
        WHERE pgh.pg_id IN (
            SELECT DISTINCT pg.pg_id FROM permission_groups pg
            LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id
            LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
            WHERE pg.created_by = ? OR uug.user_id = ?
        )
      `;
    }

    const [pgs]: any = await pool.query(pgQuery, params);
    const [pgh]: any = await pool.query(pghQuery, params);
    
    return NextResponse.json({ pgs, pgh });
  } catch (err) { 
    console.error('Fetch Permission Groups Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 }); 
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { pg_name, hostgroup_ids = [] } = await req.json();

  // Check for duplicate permission group name
  const [existing]: any = await pool.query('SELECT 1 FROM permission_groups WHERE pg_name = ?', [pg_name]);
  if (existing.length > 0) {
      return NextResponse.json({ error: 'Permission group name already exists' }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Create PG with created_by
    const [res]: any = await connection.query('INSERT INTO permission_groups (pg_name, created_by) VALUES (?, ?)', [pg_name, user.id]);
    const pg_id = res.insertId;
    
    if (hostgroup_ids && hostgroup_ids.length > 0) {
      const values = hostgroup_ids.map((id: number) => [pg_id, id]);
      try {
          await connection.query('INSERT INTO pg_hostgroups (pg_id, hostgroup_id) VALUES ?', [values]);
      } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') throw new Error('One or more hostgroups already assigned.');
          throw err;
      }
    }
    
    await connection.commit();
    connection.release();
    return NextResponse.json({ message: 'Group created', pg_id });
  } catch (err: any) { 
    await connection.rollback(); 
    connection.release();
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 }); 
  }
}
