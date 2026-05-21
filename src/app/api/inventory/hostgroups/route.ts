import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = 'SELECT * FROM hostgroup';
  const params: any[] = [];

  if (user.role !== 'admin') {
    query += ` WHERE hostgroup_id IN (
        SELECT pgh.hostgroup_id 
        FROM user_to_user_groups uug
        JOIN ug_permission_groups upg ON uug.ug_id = upg.ug_id
        JOIN pg_hostgroups pgh ON upg.pg_id = pgh.pg_id
        WHERE uug.user_id = ?
    )`;
    params.push(user.id);
  }
  
  query += ' ORDER BY hostgroup ASC';

  try {
    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch hostgroups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !checkPermission(user.role, 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const connection = await pool.getConnection();
  try {
    const { hostgroup, owner } = await req.json();
    if (!hostgroup) return NextResponse.json({ error: 'Hostgroup name is required' }, { status: 400 });
    
    await connection.beginTransaction();
    
    const [result]: any = await connection.query(
      'INSERT INTO hostgroup (hostgroup, owner) VALUES (?, ?)',
      [hostgroup, owner || '']
    );
    const hostgroup_id = result.insertId;

    if (user.role !== 'admin') {
       // Find the first permission group associated with the user's groups
       const [pgs]: any = await connection.query(`
           SELECT upg.pg_id 
           FROM user_to_user_groups uug 
           JOIN ug_permission_groups upg ON uug.ug_id = upg.ug_id 
           WHERE uug.user_id = ? LIMIT 1
       `, [user.id]);
       
       if (pgs.length > 0) {
           await connection.query('INSERT INTO pg_hostgroups (pg_id, hostgroup_id) VALUES (?, ?)', [pgs[0].pg_id, hostgroup_id]);
       }
    }
    
    await connection.commit();
    return NextResponse.json({ message: 'Hostgroup created', id: hostgroup_id });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ error: 'Failed to create hostgroup' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !checkPermission(user.role, 'update')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { hostgroup_id, hostgroup, owner } = await req.json();
    if (!hostgroup_id || !hostgroup) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    
    await pool.query(
      'UPDATE hostgroup SET hostgroup = ?, owner = ? WHERE hostgroup_id = ?',
      [hostgroup, owner || '', hostgroup_id]
    );
    
    return NextResponse.json({ message: 'Hostgroup updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update hostgroup' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !checkPermission(user.role, 'delete')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const [hostnames]: any = await pool.query('SELECT COUNT(*) as count FROM hostname WHERE hostgroup_id = ?', [id]);
    if (hostnames[0].count > 0) {
        return NextResponse.json({ error: 'Cannot delete hostgroup with attached hostnames' }, { status: 400 });
    }

    await pool.query('DELETE FROM hostgroup WHERE hostgroup_id = ?', [id]);
    return NextResponse.json({ message: 'Hostgroup deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete hostgroup' }, { status: 500 });
  }
}
