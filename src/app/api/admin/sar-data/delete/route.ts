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

    if (!hostgroup || !type || !hostname_id || !level) {
      return NextResponse.json({ error: 'All required fields are missing' }, { status: 400 });
    }

    const suffix = type === 'cpu' ? 'u' : 'r';
    const tableName = `${hostgroup}:${suffix}`;

    let query = '';
    let params: any[] = [];

    if (level === 'year') {
        if (!year || !hostname_id) return NextResponse.json({ error: 'Year and hostname_id are required' }, { status: 400 });
        query = `DELETE FROM \`${tableName}\` WHERE YEAR(time) = ? AND hostname_id = ?`;
        params = [year, hostname_id];
    } else if (level === 'month') {
        if (!month || !year || !hostname_id) return NextResponse.json({ error: 'Year, Month, and hostname_id are required' }, { status: 400 });
        query = `DELETE FROM \`${tableName}\` WHERE YEAR(time) = ? AND MONTH(time) = ? AND hostname_id = ?`;
        params = [year, month, hostname_id];
    } else if (level === 'all') {
        if (hostname_id && hostname_id.trim() !== '') {
            query = `DELETE FROM \`${tableName}\` WHERE hostname_id = ?`;
            params = [hostname_id];
        } else {
            query = `DELETE FROM \`${tableName}\``;
        }
    } else {
        if (!date || !hostname_id) return NextResponse.json({ error: 'Date and hostname_id are required' }, { status: 400 });
        query = `DELETE FROM \`${tableName}\` WHERE DATE(time) = ? AND hostname_id = ?`;
        params = [date, hostname_id];
    }

    await pool.query(query, params);

    return NextResponse.json({ message: 'Data deleted successfully' });
  } catch (error: any) {
    console.error('SAR Delete Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
