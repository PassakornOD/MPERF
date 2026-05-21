import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';

const DEFAULT_GROUPS = ['admin', 'sysadmin', 'operation'];

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let query = 'SELECT user_id, username, role FROM user';
    const params: any[] = [];

    if (user.role === 'sysadmin') {
      // Logic: See users who share a group, excluding the universal 'sysadmin' group
      query = `
        SELECT DISTINCT u.user_id, u.username, u.role 
        FROM user u
        JOIN user_to_user_groups uug ON u.user_id = uug.user_id
        WHERE uug.ug_id IN (
          SELECT ug_id FROM user_to_user_groups 
          WHERE user_id = ? 
          AND ug_id NOT IN (SELECT ug_id FROM user_groups WHERE ug_name = 'sysadmin')
        )
      `;
      params.push(user.id);
    }

    const [users]: any = await pool.query(query, params);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// Create User & Sync Group
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, password, role } = await req.json();

    // Restriction: sysadmin can only create sysadmin or operation
    if (user.role === 'sysadmin') {
        if (role !== 'sysadmin' && role !== 'operation') {
            return NextResponse.json({ error: 'Forbidden: You can only create sysadmin or operation roles' }, { status: 403 });
        }
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Insert User
        const [res]: any = await connection.query('INSERT INTO user (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        const newUserId = res.insertId;

        // 2. Sync Default Group Membership
        const [group]: any = await connection.query('SELECT ug_id FROM user_groups WHERE LOWER(ug_name) = ?', [role.toLowerCase()]);
        if (group.length > 0) {
            await connection.query('INSERT INTO user_to_user_groups (user_id, ug_id) VALUES (?, ?)', [newUserId, group[0].ug_id]);
        }

        await connection.commit();
        return NextResponse.json({ message: 'User created successfully' });
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
  } catch (error) {
    console.error('Create User Error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// Update Role & Sync Group
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { user_id, role } = await req.json();

    // Check if sysadmin has permission to manage this user
    if (user.role === 'sysadmin') {
        const [isManaged]: any = await pool.query(`
            SELECT 1 FROM user_to_user_groups uug 
            WHERE uug.user_id = ? AND uug.ug_id IN (
                SELECT ug_id FROM user_to_user_groups 
                WHERE user_id = ? 
                AND ug_id NOT IN (SELECT ug_id FROM user_groups WHERE ug_name = 'sysadmin')
            )
        `, [user_id, user.id]);

        if (isManaged.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        
        if (role !== 'sysadmin' && role !== 'operation') {
            return NextResponse.json({ error: 'Forbidden: Invalid role assignment' }, { status: 403 });
        }
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update user role
        await connection.query('UPDATE user SET role = ? WHERE user_id = ?', [role, user_id]);

        // 2. Remove from all other default groups
        const [groups]: any = await connection.query(`SELECT ug_id FROM user_groups WHERE LOWER(ug_name) IN ('${DEFAULT_GROUPS.join("','")}')`);
        const groupIds = groups.map((g: any) => g.ug_id);
        if (groupIds.length > 0) {
            await connection.query('DELETE FROM user_to_user_groups WHERE user_id = ? AND ug_id IN (?)', [user_id, groupIds]);
        }

        // 3. Add to the new default group corresponding to the role
        const [newGroup]: any = await connection.query('SELECT ug_id FROM user_groups WHERE LOWER(ug_name) = ?', [role.toLowerCase()]);
        if (newGroup.length > 0) {
            await connection.query('INSERT IGNORE INTO user_to_user_groups (user_id, ug_id) VALUES (?, ?)', [user_id, newGroup[0].ug_id]);
        }

        await connection.commit();
        return NextResponse.json({ message: 'Role and group updated successfully' });
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
  } catch (error) {
    console.error('Update Role Error:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// Delete User
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (user.role === 'sysadmin') {
        const [isManaged]: any = await pool.query(`
            SELECT 1 FROM user_to_user_groups uug 
            WHERE uug.user_id = ? AND uug.ug_id IN (
                SELECT ug_id FROM user_to_user_groups 
                WHERE user_id = ? 
                AND ug_id NOT IN (SELECT ug_id FROM user_groups WHERE ug_name = 'sysadmin')
            )
        `, [userId, user.id]);

        if (isManaged.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query('DELETE FROM user WHERE user_id = ?', [userId]);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
