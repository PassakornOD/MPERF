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
    let query = 'SELECT * FROM user_to_user_groups';
    const params: any[] = [];

    // Filter: sysadmin only sees mappings for users they have visibility of
    if (user.role === 'sysadmin') {
      query = `
        SELECT uug.* FROM user_to_user_groups uug
        WHERE uug.user_id IN (
          SELECT user_id FROM user_to_user_groups 
          WHERE user_id = ? 
          AND ug_id NOT IN (SELECT ug_id FROM user_groups WHERE LOWER(ug_name) IN ('admin', 'sysadmin', 'operation'))
        )
        OR uug.user_id = ?
      `;
      params.push(user.id, user.id);
    }

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (err) { 
    console.error('Fetch user-to-user-groups Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 }); 
  }
}
