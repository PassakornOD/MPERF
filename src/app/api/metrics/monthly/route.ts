
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hostgroup = searchParams.get('hostgroup');
  const hostnameId = searchParams.get('hostnameId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const typeParam = searchParams.get('type');
  const isMem = req.nextUrl.pathname.includes('mem') || typeParam === 'r';
  const type = isMem ? 'r' : 'u';

  if (!hostgroup || !hostnameId || !month || !year) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const tableName = `${hostgroup}:${type}`;
    
    // CPU: return idle to calculate 100-idle later, or mem for RAM
    const valCol = type === 'u' ? 'idle' : 'mem';
    
    // PHP Logic mirrors: Fetch all points with time labels
    const query = `SELECT TIME_FORMAT(time,'%H:%i') as time_label, DAY(time) as day, ${valCol} as val 
                   FROM \`${tableName}\` 
                   WHERE hostname_id = ? AND MONTH(time) = ? AND YEAR(time) = ? 
                   ORDER BY time ASC`;

    const [rows] = await pool.query(query, [hostnameId, month, year]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
