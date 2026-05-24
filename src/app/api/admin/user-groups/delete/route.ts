import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { ug_id } = await req.json();
    const connection = await pool.getConnection();

    // 1. Check group existence
    const [group]: any = await connection.query('SELECT ug_name FROM user_groups WHERE ug_id = ?', [ug_id]);
    if (group.length === 0) {
        connection.release();
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const groupName = group[0].ug_name;

    // 2. Self-deletion prevention: Cannot delete group that matches own username
    if (groupName.toLowerCase() === user.name.toLowerCase()) {
        connection.release();
        return NextResponse.json({ error: 'Forbidden: Cannot delete your own personal group' }, { status: 403 });
    }

    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM user_groups WHERE ug_id = ?', [ug_id]);
        await connection.commit();
        return NextResponse.json({ message: 'Group deleted' });
    } catch (err) { 
        await connection.rollback(); 
        throw err; 
    } finally { 
        connection.release(); 
    }
  } catch (err) { 
    console.error('Delete Group Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 }); 
  }
}
