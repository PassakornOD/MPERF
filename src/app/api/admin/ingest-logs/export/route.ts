import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = 'SELECT * FROM insertion_logs WHERE 1=1';
    const params: any[] = [];

    if (date) {
        query += ' AND DATE(timestamp) = ?';
        params.push(date);
    }
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    query += ' ORDER BY timestamp DESC';

    const [rows]: any = await pool.query(query, params);

    // Convert to CSV
    const header = 'Timestamp,User,Table,Status,Records,Message\n';
    const csv = rows.map((row: any) => {
        const date = row.timestamp ? 
          (typeof row.timestamp === 'string' ? 
            new Date(row.timestamp.includes('T') ? row.timestamp : row.timestamp.replace(' ', 'T') + 'Z') : 
            new Date(row.timestamp)) : 
          null;
        const formattedDate = date ? date.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false }).replace(',', '') : '';
        return `"${formattedDate}","${row.user}","${row.table_name}","${row.status}",${row.records_processed},"${row.message.replace(/"/g, '""')}"`;
    }).join('\n');

    return new NextResponse(header + csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ingestion_logs.csv"'
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
