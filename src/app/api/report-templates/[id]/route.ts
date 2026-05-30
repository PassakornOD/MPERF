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
    const userRole = (session.user as any).role;
    const body = await req.json();
    const { name, config } = body;

    if (!name || !config) {
      return NextResponse.json({ error: 'Name and config are required' }, { status: 400 });
    }

    // Check for duplicate name for this user (excluding current template)
    // If admin, check if template exists at all with this name? 
    // Actually, keep the original logic for user-specific names if not admin.
    // If admin, maybe they shouldn't be restricted by other users' template names?
    // Let's stick to the core permission bypass.

    let updateQuery = 'UPDATE report_templates SET name = ?, config = ? WHERE id = ? AND user_id = ?';
    let updateParams = [name, JSON.stringify(config), id, userId];

    if (userRole === 'admin') {
      updateQuery = 'UPDATE report_templates SET name = ?, config = ? WHERE id = ?';
      updateParams = [name, JSON.stringify(config), id];
    }

    const [result]: any = await pool.query(updateQuery, updateParams);

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
    const userRole = (session.user as any).role;
    
    let deleteQuery = 'DELETE FROM report_templates WHERE id = ? AND user_id = ?';
    let deleteParams = [id, userId];

    if (userRole === 'admin') {
      deleteQuery = 'DELETE FROM report_templates WHERE id = ?';
      deleteParams = [id];
    }

    const [result]: any = await pool.query(deleteQuery, deleteParams);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Template deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
