
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getAllowedHostgroups } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userRole = (session.user as any).role;
  const allowedGroups = await getAllowedHostgroups(userRole);

  let query = 'SELECT i.* FROM inventory i JOIN hostname h ON i.hostname_id = h.hostname_id WHERE i.delbit = 0';
  const params: any[] = [];

  if (userRole !== 'admin') {
    if (allowedGroups.length === 0) {
      return NextResponse.json([]); // ไม่มีสิทธิ์เข้าถึงกลุ่มใดเลย
    }
    query += ' AND h.hostgroup_id IN (?)';
    params.push(allowedGroups);
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
