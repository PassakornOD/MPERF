import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const [rows] = await pool.query('SELECT * FROM report_templates WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, config } = body;

    if (!name || !config) {
      return NextResponse.json({ error: 'Name and config are required' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      'INSERT INTO report_templates (name, config, user_id) VALUES (?, ?, ?)',
      [name, JSON.stringify(config), userId]
    );

    return NextResponse.json({ id: result.insertId, name, config, user_id: userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
