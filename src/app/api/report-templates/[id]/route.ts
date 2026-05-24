import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, config } = body;

    if (!name || !config) {
      return NextResponse.json({ error: 'Name and config are required' }, { status: 400 });
    }

    // Check for duplicate name for this user (excluding current template)
    const [existing]: any = await pool.query(
      'SELECT id FROM report_templates WHERE name = ? AND user_id = ? AND id != ?',
      [name, userId, id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'A template with this name already exists' }, { status: 400 });
    }

    // Ensure user only updates their own template
    const [result]: any = await pool.query(
      'UPDATE report_templates SET name = ?, config = ? WHERE id = ? AND user_id = ?',
      [name, JSON.stringify(config), id, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Template updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;
    
    // Ensure user only deletes their own template
    const [result]: any = await pool.query('DELETE FROM report_templates WHERE id = ? AND user_id = ?', [id, userId]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Template deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
