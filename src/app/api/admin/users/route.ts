import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';
import { logSecurityEvent } from '@/lib/logger';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let query = 'SELECT user_id, username, role FROM user';
    let params: any[] = [];

    // If current user is NOT a super-admin, filter out protected users
    if (user.username !== 'sysreport' && user.username !== 'mfadmin') {
      query += ' WHERE username NOT IN (?, ?)';
      params = ['sysreport', 'mfadmin'];
    }

    // Sysadmin access logic (further filtering for non-super-admins)
    if (user.role === 'sysadmin' && user.username !== 'sysreport' && user.username !== 'mfadmin') {
      query = `
        SELECT DISTINCT u.user_id, u.username, u.role 
        FROM user u
        JOIN user_to_user_groups uug ON u.user_id = uug.user_id
        WHERE uug.ug_id IN (
          SELECT ug_id FROM user_to_user_groups 
          WHERE user_id = ? 
          AND ug_id NOT IN (SELECT ug_id FROM user_groups WHERE ug_name = 'sysadmin')
        )
        AND u.username NOT IN ('sysreport', 'mfadmin')
      `;
      params = [user.id];
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

    // 1. Prevent username same as role name
    const [roles]: any = await pool.query('SELECT role_name FROM roles');
    const roleNames = roles.map((r: any) => r.role_name.toLowerCase());
    if (roleNames.includes(username.toLowerCase())) {
        return NextResponse.json({ error: 'Username cannot be the same as a role name' }, { status: 400 });
    }

    const [existing]: any = await pool.query('SELECT 1 FROM user WHERE username = ?', [username]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    if (user.role === 'sysadmin') {
        if (role !== 'sysadmin' && role !== 'operation') {
            return NextResponse.json({ error: 'Forbidden: You can only create sysadmin or operation roles' }, { status: 403 });
        }
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const [res]: any = await connection.query('INSERT INTO user (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        const newUserId = res.insertId;

        // 1. Create a private group named after the user
        const [groupRes]: any = await connection.query('INSERT INTO user_groups (ug_name) VALUES (?)', [username]);
        const personalGroupId = groupRes.insertId;
        await connection.query('INSERT INTO user_to_user_groups (user_id, ug_id) VALUES (?, ?)', [newUserId, personalGroupId]);

        await connection.commit();
        logSecurityEvent(`User created: ${username} with role ${role}`, { by: user.name });
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

// Update Role
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== 'admin' && user?.role !== 'sysadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { user_id, role } = await req.json();

    if (user.id === user_id) {
        return NextResponse.json({ error: 'Forbidden: Cannot change your own role' }, { status: 403 });
    }

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
        const [target]: any = await connection.query('SELECT username FROM user WHERE user_id = ?', [user_id]);
        const targetName = target[0]?.username || 'Unknown';

        await connection.query('UPDATE user SET role = ? WHERE user_id = ?', [role, user_id]);

        await connection.commit();
        logSecurityEvent(`User role updated: ${targetName} to ${role}`, { by: user.name });
        return NextResponse.json({ message: 'Role updated successfully' });
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

    if (user.id === Number(userId)) {
        return NextResponse.json({ error: 'Forbidden: Cannot delete your own account' }, { status: 403 });
    }

    const [targetUser]: any = await pool.query('SELECT username FROM user WHERE user_id = ?', [userId]);
    if (targetUser.length > 0 && ['sysreport', 'mfadmin'].includes(targetUser[0].username)) {
        return NextResponse.json({ error: 'Forbidden: Cannot delete protected accounts' }, { status: 403 });
    }

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

    const targetName = targetUser[0]?.username || 'Unknown';
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Delete user
        await connection.query('DELETE FROM user WHERE user_id = ?', [userId]);

        // 2. Safely delete the personal group if it matches the username
        await connection.query('DELETE FROM user_groups WHERE ug_name = ?', [targetName]);

        await connection.commit();
        logSecurityEvent(`User deleted: ${targetName}`, { by: user.name });
        return NextResponse.json({ message: 'User and personal group deleted successfully' });
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
