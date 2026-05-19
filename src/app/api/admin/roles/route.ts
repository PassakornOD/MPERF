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
    // Get all roles
    const [roles]: any = await pool.query('SELECT * FROM roles');
    // Get current mappings
    const [mappings]: any = await pool.query('SELECT * FROM role_hostgroups');
    
    return NextResponse.json({ roles, mappings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch RBAC data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { role_id, hostgroup_ids } = await req.json();

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Clear existing mappings for this role
    await connection.query('DELETE FROM role_hostgroups WHERE role_id = ?', [role_id]);

    // 2. Insert new mappings
    if (hostgroup_ids && hostgroup_ids.length > 0) {
      const values = hostgroup_ids.map((id: number) => [role_id, id]);
      await connection.query('INSERT INTO role_hostgroups (role_id, hostgroup_id) VALUES ?', [values]);
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('RBAC Update Error:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
