import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userId = Number((session.user as any).id);
    if (isNaN(userId)) {
        console.error('Invalid User ID in session:', (session.user as any).id);
        return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }
    console.log('--- TEMPLATE FETCH DEBUG ---');
    console.log('User Name:', session.user?.name);
    console.log('Raw User ID from session:', (session.user as any).id);
    console.log('Parsed User ID:', userId);
    console.log('User Role:', (session.user as any).role);

    let query = `
      SELECT rt.*, u.username as owner_name 
      FROM report_templates rt 
      JOIN user u ON rt.user_id = u.user_id 
      WHERE rt.user_id = ? 
      ORDER BY rt.created_at DESC
    `;
    let params = [userId];

    const [rows]: any = await pool.query(query, params);
    console.log(`DB Result: Found ${rows.length} rows`);
    console.log('---------------------------');
    
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userId = Number((session.user as any).id);
    if (isNaN(userId)) {
        return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }
    console.log('--- TEMPLATE CREATE DEBUG ---');
    console.log('User ID:', userId);
    
    const body = await req.json();
    const { name, config } = body;

    if (!name || !config) {
      return NextResponse.json({ error: 'Name and config are required' }, { status: 400 });
    }

    // Check for duplicate name for this user
    const [existing]: any = await pool.query(
      'SELECT id FROM report_templates WHERE name = ? AND user_id = ?',
      [name, userId]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'A template with this name already exists' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      'INSERT INTO report_templates (name, config, user_id) VALUES (?, ?, ?)',
      [name, JSON.stringify(config), userId]
    );

    console.log('Template created with ID:', result.insertId);
    console.log('-----------------------------');

    return NextResponse.json({ id: result.insertId, name, config, user_id: userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
