import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = `
      SELECT h.*, hg.hostgroup 
      FROM hostname h
      JOIN hostgroup hg ON h.hostgroup_id = hg.hostgroup_id
  `;
  const params: any[] = [];

  if (user.role !== 'admin') {
      query += ` WHERE h.hostgroup_id IN (
          SELECT pgh.hostgroup_id 
          FROM user_to_user_groups uug
          JOIN ug_permission_groups upg ON uug.ug_id = upg.ug_id
          JOIN pg_hostgroups pgh ON upg.pg_id = pgh.pg_id
          WHERE uug.user_id = ?
      )`;
      params.push(user.id);
  }

  query += ' ORDER BY hg.hostgroup, h.hostname';

  try {
    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
