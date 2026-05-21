import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const PROTECTED_GROUPS = ['admin', 'sysadmin', 'operation'];

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let query = 'SELECT * FROM user_groups';
    const params: any[] = [];
    
    // Logic: admin sees all, sysadmin only sees groups they are member of (excluding protected groups)
    if (user.role === 'sysadmin') {
      query = `
        SELECT ug.* FROM user_groups ug
        JOIN user_to_user_groups uug ON ug.ug_id = uug.ug_id
        WHERE uug.user_id = ? 
        AND LOWER(ug.ug_name) NOT IN ('${PROTECTED_GROUPS.join("','")}')
      `;
      params.push(user.id);
    } else if (user.role !== 'admin') {
      // Default fallback for other non-admin roles (though only sysadmin/admin currently allowed)
      query += ` WHERE LOWER(ug_name) NOT IN ('${PROTECTED_GROUPS.join("','")}')`;
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

    // Restriction: Non-admins cannot create groups with protected names
    if (user.role !== 'admin' && PROTECTED_GROUPS.includes(ug_name.toLowerCase())) {
        return NextResponse.json({ error: 'Forbidden: Cannot create protected groups' }, { status: 403 });
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
