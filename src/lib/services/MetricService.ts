
import pool from '@/lib/db';

export class MetricService {
  static async getOsType(hostnameId: number): Promise<string> {
    const [rows]: any = await pool.query('SELECT OS FROM hostname WHERE hostname_id = ?', [hostnameId]);
    return rows[0]?.OS || 'Unknown';
  }

  static async getHostGroups(userId: number, role: string): Promise<any[]> {
    let query = `
      SELECT hg.hostgroup_id, hg.hostgroup, hn.hostname_id, hn.hostname, hn.mem, hn.Pagesize 
      FROM hostgroup hg 
      LEFT JOIN hostname hn ON hg.hostgroup_id = hn.hostgroup_id
    `;

    const params: any[] = [];

    // Filter by permission chain if not global admin
    if (role !== 'admin') {
      query += `
        WHERE hg.hostgroup_id IN (
            SELECT pgh.hostgroup_id 
            FROM pg_hostgroups pgh
            JOIN permission_groups pg ON pgh.pg_id = pg.pg_id
            LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id 
            LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
            WHERE uug.user_id = ? OR pg.created_by = ?
        )
      `;
      params.push(userId, userId);
    }

    query += ' ORDER BY hg.hostgroup ASC';

    try {
      const [rows] = await pool.query(query, params);
      const hostgroups: any[] = [];
      (rows as any[]).forEach(row => {
        let group = hostgroups.find(g => g.hostgroup_id === row.hostgroup_id);
        if (!group) {
          group = { hostgroup_id: row.hostgroup_id, hostgroup: row.hostgroup, hostnames: [] };
          hostgroups.push(group);
        }
        if (row.hostname_id) {
          group.hostnames.push({ hostname_id: row.hostname_id, hostname: row.hostname, mem: row.mem, pagesize: row.Pagesize });
        }
      });
      return hostgroups;
    } catch (e) {
      console.error('Failed to fetch hostgroups:', e);
      return [];
    }
  }

  static async canAccessHostgroup(userId: number, role: string, hostgroup: string): Promise<boolean> {
      // Only global admin bypassing checks
      if (role === 'admin') return true;
      
      const [rows]: any = await pool.query(
          `SELECT 1 FROM hostgroup hg
           LEFT JOIN pg_hostgroups pgh ON hg.hostgroup_id = pgh.hostgroup_id
           LEFT JOIN permission_groups pg ON pgh.pg_id = pg.pg_id
           LEFT JOIN ug_permission_groups upg ON pg.pg_id = upg.pg_id 
           LEFT JOIN user_to_user_groups uug ON upg.ug_id = uug.ug_id
           WHERE hg.hostgroup = ? AND (pg.created_by = ? OR uug.user_id = ?)`,
          [hostgroup, userId, userId]
      );
      return rows.length > 0;
  }
  // ... rest of the methods remain unchanged ...
  static async getCpuDaily(userId: number, role: string, hostgroup: string, hostnameId: number, type: 'Peak' | 'Normal' | 'Average', startDate: string, endDate: string): Promise<any[]> {
    if (!(await this.canAccessHostgroup(userId, role, hostgroup))) return [];
    const osType = await this.getOsType(hostnameId);
    const isRedHat = osType.toLowerCase().includes('red hat') || osType.toLowerCase().includes('redhat');
    const tableName = `${hostgroup}:u`;
    const start = `${startDate} 00:00:00`;
    const end = `${endDate} 23:59:59`;
    let query = '';
    if (isRedHat) {
        if (type === 'Normal') query = 'SELECT time, usr, nice, sys, wio, steal, idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? ORDER BY time ASC';
        else if (type === 'Average') query = 'SELECT DATE(time) as time, AVG(usr) as usr, AVG(nice) as nice, AVG(sys) as sys, AVG(wio) as wio, AVG(steal) as steal, AVG(idle) as idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
        else query = 'SELECT DATE(time) as time, AVG(usr+nice+sys+wio+steal) as usr, MIN(idle) as idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
    } else {
        if (type === 'Normal') query = 'SELECT time, usr, sys, wio, idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? ORDER BY 1 ASC';
        else if (type === 'Average') query = 'SELECT DATE(time) as time, AVG(usr) as usr, AVG(sys) as sys, AVG(wio) as wio, AVG(idle) as idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
        else query = 'SELECT DATE(time) as time, AVG(usr+sys+wio) as usr, MIN(idle) as idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
    }
    try { const [rows] = await pool.query(query, [hostnameId, start, end]); return rows as any[]; } catch (e) { return []; }
  }

  static async getCpuMonthly(userId: number, role: string, hostgroup: string, hostnameId: number, month: string, year: string): Promise<any[]> {
    if (!(await this.canAccessHostgroup(userId, role, hostgroup))) return [];
    const tableName = `${hostgroup}:u`;
    const query = `SELECT TIME_FORMAT(time,'%H:%i') as time_label, DAY(time) as day, idle as val FROM \`${tableName}\` WHERE hostname_id = ? AND MONTH(time) = ? AND YEAR(time) = ? ORDER BY time ASC`;
    try { const [rows] = await pool.query(query, [hostnameId, month, year]); return rows as any[]; } catch (e) { return []; }
  }

  static async getMemDaily(userId: number, role: string, hostgroup: string, hostnameId: number, type: 'Peak' | 'Normal', startDate: string, endDate: string): Promise<any> {
      if (!(await this.canAccessHostgroup(userId, role, hostgroup))) {
          console.warn(`Access denied for user ${userId} to hostgroup ${hostgroup}`);
          return { data: [], totalAvg: 0 };
      }
      const tableName = `${hostgroup}:r`;
      const start = `${startDate} 00:00:00`;
      const end = `${endDate} 23:59:59`;
      
      try {
          const [avgRows]: any = await pool.query(`SELECT AVG(mem) as total_avg FROM \`${tableName}\` WHERE hostname_id = ? AND time BETWEEN ? AND ?`, [hostnameId, start, end]);
          const totalAvg = avgRows[0]?.total_avg || 0;
          
          const query = type === 'Normal' 
            ? `SELECT time as time, mem FROM \`${tableName}\` WHERE hostname_id = ? AND time BETWEEN ? AND ? ORDER BY time ASC` 
            : `SELECT DATE(time) as time, MAX(mem) as mem, AVG(mem) as avg_mem FROM \`${tableName}\` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC`;
          
          const [rows] = await pool.query(query, [hostnameId, start, end]);
          return { data: rows as any[], totalAvg: totalAvg };
      } catch (e) {
          console.error(`Database error in getMemDaily for table ${tableName}:`, e);
          return { data: [], totalAvg: 0 };
      }
  }

  static async getMemMonthly(userId: number, role: string, hostgroup: string, hostnameId: number, month: string, year: string): Promise<any[]> {
      if (!(await this.canAccessHostgroup(userId, role, hostgroup))) return [];
      const tableName = `${hostgroup}:r`;
      const query = `SELECT TIME_FORMAT(time,'%H:%i') as time_label, DAY(time) as day, mem as val FROM \`${tableName}\` WHERE hostname_id = ? AND MONTH(time) = ? AND YEAR(time) = ? ORDER BY time ASC`;
      try { const [rows] = await pool.query(query, [hostnameId, month, year]); return rows as any[]; } catch (e) { return []; }
  }

  static async getCpuStatsSummary(userId: number, role: string, hostgroup: string, hostnameId: number, targetMonth: string, targetYear: string): Promise<any[]> {
    if (!(await this.canAccessHostgroup(userId, role, hostgroup))) return [];
    const tableName = `${hostgroup}:u`;
    const query = `
      SELECT MONTH(time) as month, YEAR(time) as year, ROUND(AVG(100 - idle), 2) as value 
      FROM \`${tableName}\` 
      WHERE hostname_id = ? 
      AND time <= LAST_DAY(STR_TO_DATE(CONCAT(?, '-', ?, '-01'), '%Y-%m-%d'))
      AND time >= DATE_SUB(LAST_DAY(STR_TO_DATE(CONCAT(?, '-', ?, '-01'), '%Y-%m-%d')), INTERVAL 12 MONTH)
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `;
    try { const [rows] = await pool.query(query, [hostnameId, targetYear, targetMonth, targetYear, targetMonth]); return rows as any[]; } catch (e) { return []; }
  }

  static async getMemStatsSummary(userId: number, role: string, hostgroup: string, hostnameId: number, targetMonth: string, targetYear: string): Promise<any[]> {
    if (!(await this.canAccessHostgroup(userId, role, hostgroup))) return [];
    const tableName = `${hostgroup}:r`;
    const query = `
      SELECT MONTH(time) as month, YEAR(time) as year, ROUND(AVG(mem), 2) as value 
      FROM \`${tableName}\` 
      WHERE hostname_id = ? 
      AND time <= LAST_DAY(STR_TO_DATE(CONCAT(?, '-', ?, '-01'), '%Y-%m-%d'))
      AND time >= DATE_SUB(LAST_DAY(STR_TO_DATE(CONCAT(?, '-', ?, '-01'), '%Y-%m-%d')), INTERVAL 12 MONTH)
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `;
    try { const [rows] = await pool.query(query, [hostnameId, targetYear, targetMonth, targetYear, targetMonth]); return rows as any[]; } catch (e) { return []; }
  }
}
