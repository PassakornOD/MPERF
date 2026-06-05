import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkPermission } from '@/lib/permissions';
import { logSecurityEvent } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = 'SELECT * FROM hostgroup';
  const params: any[] = [];

  if (user.role !== 'admin') {
    const isSysAdmin = user.role === 'sysadmin';
    query += ` WHERE hostgroup_id IN (
        SELECT pgh.hostgroup_id 
        FROM pg_hostgroups pgh
        JOIN permission_groups pg ON pgh.pg_id = pg.pg_id
        LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id 
        LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
        WHERE uug.user_id = ? ${isSysAdmin ? 'OR pg.created_by = ?' : ''}
    )`;
    params.push(user.id);
    if (isSysAdmin) params.push(user.id);
  }
  
  query += ' ORDER BY hostgroup ASC';

  try {
    const [rows]: any = await pool.query(query, params);
    
    // Fetch hostnames for all these hostgroups
    const hostgroupIds = rows.map((r: any) => r.hostgroup_id);
    let hostnames: any[] = [];
    if (hostgroupIds.length > 0) {
        const [hnRows] = await pool.query('SELECT * FROM hostname WHERE hostgroup_id IN (?)', [hostgroupIds]) as any;
        hostnames = hnRows;
    }

    // Map hostnames to hostgroups
    const result = rows.map((hg: any) => ({
        ...hg,
        hostnames: hostnames.filter((hn: any) => hn.hostgroup_id === hg.hostgroup_id)
    }));

    return NextResponse.json(result);
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
    const { hostgroup, owner, pg_id } = await req.json();
    if (!hostgroup || !pg_id) return NextResponse.json({ error: 'Hostgroup name and PG ID are required' }, { status: 400 });
    
    // Check if sysadmin has access to target PG
    if (user.role !== 'admin') {
        const [access]: any = await connection.query(`
            SELECT 1 FROM permission_groups pg
            LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id
            LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
            WHERE pg.pg_id = ? AND (pg.created_by = ? OR uug.user_id = ?)
        `, [pg_id, user.id, user.id]);
        if (access.length === 0) return NextResponse.json({ error: 'Forbidden: No access to this PG' }, { status: 403 });
    }
    
    // Check for duplicate name
    const [existing]: any = await connection.query('SELECT 1 FROM hostgroup WHERE hostgroup = ?', [hostgroup]);
    if (existing.length > 0) {
        connection.release();
        return NextResponse.json({ error: 'Hostgroup name already exists' }, { status: 400 });
    }
    
    await connection.beginTransaction();
    
    const [result]: any = await connection.query(
      'INSERT INTO hostgroup (hostgroup, owner) VALUES (?, ?)',
      [hostgroup, owner || '']
    );
    const hostgroup_id = result.insertId;

    await connection.query('INSERT INTO pg_hostgroups (pg_id, hostgroup_id) VALUES (?, ?)', [pg_id, hostgroup_id]);
    
    await connection.commit();
    logSecurityEvent(`Hostgroup created: ${hostgroup}`, { by: user.name, id: hostgroup_id });
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

  const connection = await pool.getConnection();
  try {
    const { hostgroup_id, hostgroup, owner, pg_id } = await req.json();
    if (!hostgroup_id || !hostgroup || !pg_id) return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    
    // Check sysadmin access to new PG
    if (user.role !== 'admin') {
        const [access]: any = await connection.query(`
            SELECT 1 FROM permission_groups pg
            LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id
            LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
            WHERE pg.pg_id = ? AND (pg.created_by = ? OR uug.user_id = ?)
        `, [pg_id, user.id, user.id]);
        if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connection.beginTransaction();
    await connection.query(
      'UPDATE hostgroup SET hostgroup = ?, owner = ? WHERE hostgroup_id = ?',
      [hostgroup, owner || '', hostgroup_id]
    );
    
    await connection.query('DELETE FROM pg_hostgroups WHERE hostgroup_id = ?', [hostgroup_id]);
    await connection.query('INSERT INTO pg_hostgroups (pg_id, hostgroup_id) VALUES (?, ?)', [pg_id, hostgroup_id]);

    await connection.commit();
    logSecurityEvent(`Hostgroup updated: ${hostgroup}`, { by: user.name, id: hostgroup_id });
    return NextResponse.json({ message: 'Hostgroup updated' });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ error: 'Failed to update hostgroup' }, { status: 500 });
  } finally {
    connection.release();
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
    
    await pool.query('DELETE FROM hostgroup WHERE hostgroup_id = ?', [id]);
    logSecurityEvent(`Hostgroup deleted`, { by: user.name, id: id });
    return NextResponse.json({ message: 'Hostgroup deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete hostgroup' }, { status: 500 });
  }
}
