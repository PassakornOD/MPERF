import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { table, limit = 100, year, month, day } = await req.json();

    if (!table) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }

    if (!/^[A-Za-z0-9_.-]+:[ur]$/.test(table)) {
      return NextResponse.json({ error: 'Invalid table format.' }, { status: 400 });
    }

    let query = `SELECT * FROM \`${table}\``;
    const params: any[] = [];
    const conditions: string[] = [];

    if (year && month && day) {
        // Handle "19 May 2026" style if needed, but here we assume numeric/string parts
        // For simplicity, we'll support "YYYY-MM-DD" if day is a full string or individual parts
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let m = month;
        if (isNaN(Number(month))) {
            const mIdx = monthNames.indexOf(month);
            if (mIdx !== -1) m = (mIdx + 1).toString().padStart(2, '0');
        } else {
            m = month.toString().padStart(2, '0');
        }
        
        const d = day.toString().padStart(2, '0');
        conditions.push(`DATE(time) = ?`);
        params.push(`${year}-${m}-${d}`);
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY time DESC LIMIT ?`;
    params.push(Number(limit));

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({ 
        table,
        filter: { year, month, day },
        count: rows.length,
        data: rows 
    });
  } catch (error: any) {
    console.error('Query Data Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to query data' }, { status: 500 });
  }
}
