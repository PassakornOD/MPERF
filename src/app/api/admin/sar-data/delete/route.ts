import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { hostgroup, type, date, month, year, hostname_id, level } = await req.json();

    if (!hostgroup || !type || !level) {
      return NextResponse.json({ error: 'All required fields are missing' }, { status: 400 });
    }

    const suffix = type === 'cpu' ? 'u' : 'r';
    const tableName = `${hostgroup}:${suffix}`;

    let query = '';
    let params: any[] = [];

    if (level === 'year') {
        if (!year) return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        query = `DELETE FROM \`${tableName}\` WHERE YEAR(time) = ?`;
        params = [year];
        if (hostname_id) {
            query += ' AND hostname_id = ?';
            params.push(hostname_id);
        }
    } else if (level === 'month') {
        if (!month || !year) return NextResponse.json({ error: 'Year and Month are required' }, { status: 400 });
        query = `DELETE FROM \`${tableName}\` WHERE YEAR(time) = ? AND MONTH(time) = ?`;
        params = [year, month];
        if (hostname_id) {
            query += ' AND hostname_id = ?';
            params.push(hostname_id);
        }
    } else if (level === 'all') {
        query = `DELETE FROM \`${tableName}\``;
        if (hostname_id && hostname_id.toString().trim() !== '') {
            query += ' WHERE hostname_id = ?';
            params = [hostname_id];
        }
    } else {
        if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        query = `DELETE FROM \`${tableName}\` WHERE DATE(time) = ?`;
        params = [date];
        if (hostname_id) {
            query += ' AND hostname_id = ?';
            params.push(hostname_id);
        }
    }

    await pool.query(query, params);

    return NextResponse.json({ message: 'Data deleted successfully' });
  } catch (error: any) {
    console.error('SAR Delete Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
