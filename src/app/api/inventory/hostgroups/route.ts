
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM hostgroup ORDER BY hostgroup ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch hostgroups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { hostgroup, owner } = await req.json();
    if (!hostgroup) return NextResponse.json({ error: 'Hostgroup name is required' }, { status: 400 });
    
    const [result]: any = await pool.query(
      'INSERT INTO hostgroup (hostgroup, owner) VALUES (?, ?)',
      [hostgroup, owner || '']
    );
    
    return NextResponse.json({ message: 'Hostgroup created', id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create hostgroup' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { hostgroup_id, hostgroup, owner } = await req.json();
    if (!hostgroup_id || !hostgroup) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    
    await pool.query(
      'UPDATE hostgroup SET hostgroup = ?, owner = ? WHERE hostgroup_id = ?',
      [hostgroup, owner || '', hostgroup_id]
    );
    
    return NextResponse.json({ message: 'Hostgroup updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update hostgroup' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    // Check if there are hostnames attached
    const [hostnames]: any = await pool.query('SELECT COUNT(*) as count FROM hostname WHERE hostgroup_id = ?', [id]);
    if (hostnames[0].count > 0) {
        return NextResponse.json({ error: 'Cannot delete hostgroup with attached hostnames' }, { status: 400 });
    }

    await pool.query('DELETE FROM hostgroup WHERE hostgroup_id = ?', [id]);
    return NextResponse.json({ message: 'Hostgroup deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete hostgroup' }, { status: 500 });
  }
}
