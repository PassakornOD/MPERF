
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllowedHostgroups } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  // RBAC Check
  const userRole = (session.user as any).role;
  const allowedGroups = await getAllowedHostgroups(userRole);
  
  // Find hostgroup ID to verify access (Assuming a quick lookup or passed as param)
  const [hg]: any = await pool.query('SELECT hostgroup_id FROM hostgroup WHERE hostgroup = ?', [hostgroup]);
  if (hg.length > 0) {
      const hgId = hg[0].hostgroup_id;
      if (userRole !== 'admin' && !allowedGroups.includes(hgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
  }

  try {
    const tableName = `${hostgroup}:${type}`;
    const valCol = type === 'u' ? 'idle' : 'mem';
    
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
