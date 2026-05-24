import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Logic: Exclude groups that have the same name as any username
    let query = `
      SELECT ug.* FROM user_groups ug
      WHERE ug.ug_name NOT IN (SELECT username FROM user)
    `;
    const params: any[] = [];
    
    // Additional Logic for sysadmin: only see groups they are member of (still excluding personal groups)
    if (user.role === 'sysadmin') {
      query = `
        SELECT ug.* FROM user_groups ug
        JOIN user_to_user_groups uug ON ug.ug_id = uug.ug_id
        WHERE uug.user_id = ?
        AND ug.ug_name NOT IN (SELECT username FROM user)
      `;
      params.push(user.id);
    }

    const [groups]: any = await pool.query(query, params);
    return NextResponse.json(groups);
  } catch (err) { 
    console.error('Fetch User Groups Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 }); 
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

    try {
    const { ug_name } = await req.json();

    // 1. Prevent group name same as any username
    const [users]: any = await pool.query('SELECT username FROM user');
    const usernames = users.map((u: any) => u.username.toLowerCase());
    if (usernames.includes(ug_name.toLowerCase())) {
        return NextResponse.json({ error: 'Group name cannot be the same as a username' }, { status: 400 });
    }

    // Check for duplicate group name
    const [existing]: any = await pool.query('SELECT 1 FROM user_groups WHERE ug_name = ?', [ug_name]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Group name already exists' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create Group
        const [res]: any = await connection.query('INSERT INTO user_groups (ug_name) VALUES (?)', [ug_name]);
        const newGroupId = res.insertId;

        // 2. Add creator to the group automatically
        await connection.query('INSERT INTO user_to_user_groups (user_id, ug_id) VALUES (?, ?)', [user.id, newGroupId]);

        await connection.commit();
        return NextResponse.json({ message: 'Group created' });
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
  } catch (err) { 
    console.error('Create User Group Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 }); 
  }
}
