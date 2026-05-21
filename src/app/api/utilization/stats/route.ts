
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MetricService } from '@/lib/services/MetricService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const hostgroup = searchParams.get('hostgroup') || '';
  const year = searchParams.get('year');
  const type = req.headers.get('x-type') === 'mem' ? 'r' : 'u';

  if (!hostgroup || !year) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // RBAC check
  if (!(await MetricService.canAccessHostgroup(Number(user.id), user.role, hostgroup))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const tableName = `${hostgroup}:${type}`;
    const metricCol = type === 'r' ? 'mem' : '(usr + sys + wio)';
    
    const query = 'SELECT h.hostname, MONTH(t.time) as month, AVG(' + metricCol + ') as val ' +
                  'FROM `' + tableName + '` t ' +
                  'JOIN hostname h ON t.hostname_id = h.hostname_id ' +
                  'WHERE YEAR(t.time) = ? ' +
                  'GROUP BY h.hostname, MONTH(t.time) ' +
                  'ORDER BY h.hostname, month';

    const [rows] = await pool.query(query, [year]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
