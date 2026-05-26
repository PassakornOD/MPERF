import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'sysadmin', 'operation'].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const hostgroup = searchParams.get('hostgroup');
    const hostnameId = searchParams.get('hostname_id');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!hostgroup || !type || !year || !month) {
      return NextResponse.json({ error: 'Hostgroup, Type, Year, and Month are required' }, { status: 400 });
    }

    const suffix = type === 'cpu' ? 'u' : 'r';
    const tableName = `${hostgroup}:${suffix}`;

    let query = `
      SELECT DATE(t.time) as date, h.hostname, t.hostname_id, COUNT(*) as count 
      FROM \`${tableName}\` t
      JOIN hostname h ON t.hostname_id = h.hostname_id
      WHERE YEAR(t.time) = ? AND MONTH(t.time) = ?
    `;
    const params: any[] = [year, month];

    if (hostnameId && hostnameId.trim() !== '') {
        query += ` AND t.hostname_id = ?`;
        params.push(hostnameId);
    }

    query += ` GROUP BY DATE(time), t.hostname_id ORDER BY h.hostname ASC, date ASC`;

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
