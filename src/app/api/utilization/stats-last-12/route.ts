
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const hostgroup = searchParams.get('hostgroup');
  const type = req.headers.get('x-type') === 'mem' ? 'r' : 'u';
  const targetMonth = searchParams.get('month');
  const targetYear = searchParams.get('year');

  if (!hostgroup) {
    return NextResponse.json({ error: 'Missing hostgroup' }, { status: 400 });
  }

  // Auth check: verify if the user can access this specific hostgroup via the unified chain
  if (user.role !== 'admin') {
    const [access]: any = await pool.query(`
        SELECT 1 FROM user_to_user_groups uug 
        JOIN ug_permission_groups upg ON uug.ug_id = upg.ug_id 
        JOIN pg_hostgroups pgh ON upg.pg_id = pgh.pg_id 
        JOIN hostgroup hg ON pgh.hostgroup_id = hg.hostgroup_id 
        WHERE uug.user_id = ? AND hg.hostgroup = ?`,
        [user.id, hostgroup]
    );
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const tableName = `${hostgroup}:${type}`;
    const refDate = (targetMonth && targetYear) 
      ? `DATE_ADD('${targetYear}-${targetMonth.padStart(2, '0')}-01', INTERVAL 1 MONTH)` 
      : 'NOW()';

    let query;
    if (type === 'u') {
        query = `SELECT h.hostname, MONTH(t.time) as month, YEAR(t.time) as year, 
                        AVG(t.usr) as avg_usr, AVG(t.sys) as avg_sys, AVG(t.wio) as avg_wio, AVG(t.idle) as avg_idle
                 FROM \`${tableName}\` t 
                 JOIN hostname h ON t.hostname_id = h.hostname_id 
                 WHERE t.time >= DATE_SUB(DATE_FORMAT(${refDate}, "%Y-%m-01"), INTERVAL 12 MONTH)
                 AND t.time < DATE_FORMAT(${refDate}, "%Y-%m-01")
                 GROUP BY h.hostname, YEAR(t.time), MONTH(t.time) 
                 ORDER BY h.hostname, YEAR(t.time), MONTH(t.time)`;
    } else {
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
