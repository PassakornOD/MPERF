import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = 'SELECT * FROM insertion_logs WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM insertion_logs WHERE 1=1';
    const params: any[] = [];

    if (date) {
        query += ' AND timestamp >= ? AND timestamp <= ?';
        countQuery += ' AND timestamp >= ? AND timestamp <= ?';
        params.push(`${date} 00:00:00`, `${date} 23:59:59`);
    }
    if (status) {
        query += ' AND status = ?';
        countQuery += ' AND status = ?';
        params.push(status);
    }

    const [totalRows]: any = await pool.query(countQuery, params);
    const total = totalRows[0].total;

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    const [rows]: any = await pool.query(query, [...params, pageSize, (page - 1) * pageSize]);
    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
