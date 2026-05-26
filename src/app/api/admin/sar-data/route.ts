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
    const type = searchParams.get('type'); // 'cpu' or 'mem'
    const hostgroup = searchParams.get('hostgroup');
    const hostnameId = searchParams.get('hostname_id');
    const level = searchParams.get('level');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const day = searchParams.get('day');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    if (!hostgroup || !type) {
      return NextResponse.json({ error: 'Hostgroup and Type are required' }, { status: 400 });
    }

    const suffix = type === 'cpu' ? 'u' : 'r';
    const tableName = `${hostgroup}:${suffix}`;

    // Get total count first
    let countQuery = `SELECT COUNT(*) as total FROM \`${tableName}\` AS t WHERE 1=1`;
    let query = `SELECT * FROM \`${tableName}\` AS t WHERE 1=1`;
    const params: any[] = [];

    if (hostnameId && hostnameId.trim() !== '') {
        query += ` AND hostname_id = ?`;
        countQuery += ` AND hostname_id = ?`;
        params.push(hostnameId);
    }

    if (year) {
        if (level === 'year') {
            query += ` AND YEAR(t.time) = ?`;
            countQuery += ` AND YEAR(t.time) = ?`;
            params.push(year);
        } else if (level === 'month' && month) {
            query += ` AND YEAR(t.time) = ? AND MONTH(t.time) = ?`;
            countQuery += ` AND YEAR(t.time) = ? AND MONTH(t.time) = ?`;
            params.push(year, month);
        } else if (level === 'day' && month && day) {
            query += ` AND DATE(t.time) = ?`;
            countQuery += ` AND DATE(t.time) = ?`;
            params.push(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
    }

    // Get total
    const [countRows]: any = await pool.query(countQuery, params);
    const total = countRows[0].total;

    // Fetch paginated data
    query += ` ORDER BY time DESC LIMIT ? OFFSET ?`;
    const paginatedParams = [...params, pageSize, (page - 1) * pageSize];

    const [rows]: any = await pool.query(query, paginatedParams);

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (error: any) {
    console.error('SAR Data Query Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to query SAR data' }, { status: 500 });
  }
}
