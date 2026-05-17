
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hostgroup = searchParams.get('hostgroup');
  const year = searchParams.get('year');
  const isMem = req.nextUrl.pathname.includes('mem');
  const type = isMem ? 'r' : 'u';

  if (!hostgroup || !year) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const tableName = `${hostgroup}_${type}`;
    // Aggregating monthly averages
    const query = `
      SELECT h.hostname, MONTH(t.time) as month, AVG(${type === 'r' ? 'mem' : 'usr + sys + wio'}) as val
      FROM \`${tableName}\` t
      JOIN hostname h ON t.hostname_id = h.hostname_id
      WHERE YEAR(t.time) = ?
      GROUP BY h.hostname, MONTH(t.time)
    `;

    const [rows] = await pool.query(query, [year]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
