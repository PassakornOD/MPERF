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
    const [rows]: any = await pool.query('SELECT * FROM roles');
    
    // Filter: sysadmin cannot see 'admin' role to prevent assigning it
    let roles = rows;
    if (user.role !== 'admin') {
        roles = rows.filter((r: any) => r.role_name !== 'admin');
    }

    return NextResponse.json({ roles, mappings: [] }); // mappings handled by other specific APIs if needed
  } catch (error) {
    console.error('Fetch Roles Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
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
    await connection.query('DELETE FROM role_hostgroups WHERE role_id = ?', [role_id]);
    if (hostgroup_ids && hostgroup_ids.length > 0) {
      const values = hostgroup_ids.map((id: number) => [role_id, id]);
      await connection.query('INSERT INTO role_hostgroups (role_id, hostgroup_id) VALUES ?', [values]);
    }
    await connection.commit();
    connection.release();
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
