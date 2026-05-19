import pool from './db';

/**
 * ดึงรายการ hostgroup_id ทั้งหมดที่ Role นี้มีสิทธิ์เข้าถึง
 */
export async function getAllowedHostgroups(role: string): Promise<number[]> {
  if (role === 'admin') return []; // Admin เข้าถึงได้ทั้งหมด

  try {
    const query = `
      SELECT rh.hostgroup_id 
      FROM role_hostgroups rh
      JOIN roles r ON rh.role_id = r.role_id
      WHERE r.role_name = ?
    `;
    const [rows]: any = await pool.query(query, [role]);
    return rows.map((r: any) => r.hostgroup_id);
  } catch (error) {
    console.error('Error fetching allowed hostgroups:', error);
    return [];
  }
}
