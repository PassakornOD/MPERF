
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = `
    SELECT i.* 
    FROM inventory i 
    JOIN hostname h ON i.hostname_id = h.hostname_id 
    WHERE i.delbit = 0
  `;
  const params: any[] = [];

  if (user.role !== 'admin') {
    const isSysAdmin = user.role === 'sysadmin';
    query += ` AND h.hostgroup_id IN (
        SELECT DISTINCT pgh.hostgroup_id 
        FROM pg_hostgroups pgh
        JOIN permission_groups pg ON pgh.pg_id = pg.pg_id
        LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id 
        LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
        WHERE uug.user_id = ? ${isSysAdmin ? 'OR pg.created_by = ?' : ''}
    )`;
    params.push(user.id);
    if (isSysAdmin) params.push(user.id);
  }

  query += ' ORDER BY i.actiondate DESC LIMIT 100';

  try {
    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
