
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Select all fields from hostname and join hostgroup
    const query = `
      SELECT h.*, hg.hostgroup 
      FROM hostname h
      JOIN hostgroup hg ON h.hostgroup_id = hg.hostgroup_id
      ORDER BY hg.hostgroup, h.hostname
    `;
    const [rows] = await pool.query(query);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
