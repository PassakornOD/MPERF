
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hostgroup = searchParams.get('hostgroup');
  const type = req.headers.get('x-type') === 'mem' ? 'r' : 'u';
  const targetMonth = searchParams.get('month');
  const targetYear = searchParams.get('year');

  if (!hostgroup) {
    return NextResponse.json({ error: 'Missing hostgroup' }, { status: 400 });
  }

  try {
    const tableName = `${hostgroup}:${type}`;
    
    // Construct temporal boundaries based on target month/year
    const refDate = (targetMonth && targetYear) 
      ? `'${targetYear}-${targetMonth.padStart(2, '0')}-01'` 
      : 'NOW()';

    let query;
    if (type === 'u') {
        // CPU utilization as per legacy: 100 - idle
        query = `SELECT h.hostname, MONTH(t.time) as month, YEAR(t.time) as year, 
                        AVG(t.usr) as avg_usr, AVG(t.sys) as avg_sys, AVG(t.wio) as avg_wio, AVG(t.idle) as avg_idle
                 FROM \`${tableName}\` t 
                 JOIN hostname h ON t.hostname_id = h.hostname_id 
                 WHERE t.time >= DATE_SUB(DATE_FORMAT(${refDate}, "%Y-%m-01"), INTERVAL 12 MONTH)
                 AND t.time < DATE_FORMAT(${refDate}, "%Y-%m-01")
                 GROUP BY h.hostname, YEAR(t.time), MONTH(t.time) 
                 ORDER BY h.hostname, YEAR(t.time), MONTH(t.time)`;
    } else {
        // Memory utilization: mem column
        query = `SELECT h.hostname, MONTH(t.time) as month, YEAR(t.time) as year, AVG(t.mem) as val 
                 FROM \`${tableName}\` t 
                 JOIN hostname h ON t.hostname_id = h.hostname_id 
                 WHERE t.time >= DATE_SUB(DATE_FORMAT(${refDate}, "%Y-%m-01"), INTERVAL 12 MONTH)
                 AND t.time < DATE_FORMAT(${refDate}, "%Y-%m-01")
                 GROUP BY h.hostname, YEAR(t.time), MONTH(t.time) 
                 ORDER BY h.hostname, YEAR(t.time), MONTH(t.time)`;
    }

    const [rows] = await pool.query(query);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
