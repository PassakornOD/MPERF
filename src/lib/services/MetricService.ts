
import pool from '@/lib/db';

export class MetricService {
  static async getOsType(hostnameId: number): Promise<string> {
    const [rows]: any = await pool.query('SELECT OS FROM hostname WHERE hostname_id = ?', [hostnameId]);
    return rows[0]?.OS || 'Unknown';
  }

  static async getCpuDaily(
    hostgroup: string,
    hostnameId: number,
    type: 'Peak' | 'Normal' | 'Average',
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const osType = await this.getOsType(hostnameId);
    const isRedHat = osType.toLowerCase().includes('red hat') || osType.toLowerCase().includes('redhat');
    
    const tableName = `${hostgroup}:u`;
    const start = `${startDate} 00:00:00`;
    const end = `${endDate} 23:59:59`;
    
    let query = '';
    
    if (isRedHat) {
        if (type === 'Normal') {
            query = 'SELECT time, usr, nice, sys, wio, steal, idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? ORDER BY time ASC';
        } else if (type === 'Average') {
            query = 'SELECT DATE(time) as time, AVG(usr) as usr, AVG(nice) as nice, AVG(sys) as sys, AVG(wio) as wio, AVG(steal) as steal, AVG(idle) as idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
        } else {
            query = 'SELECT DATE(time) as time, AVG(usr+nice+sys+wio+steal) as usr, MIN(idle) as idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
        }
    } else {
        if (type === 'Normal') {
            query = 'SELECT time, usr, sys, wio, idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? ORDER BY 1 ASC';
        } else if (type === 'Average') {
            query = 'SELECT DATE(time) as time, AVG(usr) as usr, AVG(sys) as sys, AVG(wio) as wio, AVG(idle) as idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
        } else {
            query = 'SELECT DATE(time) as time, AVG(usr+sys+wio) as usr, MIN(idle) as idle FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
        }
    }

    try {
      const [rows] = await pool.query(query, [hostnameId, start, end]);
      return rows as any[];
    } catch (e) {
      console.error(`Database Error on table ${tableName}:`, e);
      return [];
    }
  }

  static async getCpuMonthly(
    hostgroup: string,
    hostnameId: number,
    month: string,
    year: string
  ): Promise<any[]> {
    const tableName = `${hostgroup}:u`;
    const query = `SELECT TIME_FORMAT(time,'%H:%i') as time_label, DAY(time) as day, idle 
                   FROM \`${tableName}\` 
                   WHERE hostname_id = ? AND MONTH(time) = ? AND YEAR(time) = ? 
                   ORDER BY time ASC`;

    try {
      const [rows] = await pool.query(query, [hostnameId, month, year]);
      return rows as any[];
    } catch (e) {
      console.error(`Database Error on table ${tableName}:`, e);
      return [];
    }
  }

  static async getMemDaily(
    hostgroup: string,
    hostnameId: number,
    type: 'Peak' | 'Normal',
    startDate: string,
    endDate: string
  ): Promise<any> {
      const tableName = `${hostgroup}:r`;
      const start = `${startDate} 00:00:00`;
      const end = `${endDate} 23:59:59`;
      let query = '';
      
      // We also need the total average for the plotLine in Normal mode
      const [avgRows]: any = await pool.query(`SELECT AVG(mem) as total_avg FROM \`${tableName}\` WHERE hostname_id = ? AND time BETWEEN ? AND ?`, [hostnameId, start, end]);
      const totalAvg = avgRows[0]?.total_avg || 0;

      if (type === 'Normal') {
          query = 'SELECT time as time, mem FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? ORDER BY time ASC';
      } else {
          query = 'SELECT DATE(time) as time, MAX(mem) as mem, AVG(mem) as avg_mem FROM `' + tableName + '` WHERE hostname_id = ? AND time BETWEEN ? AND ? GROUP BY 1 ORDER BY 1 ASC';
      }

      try {
          const [rows] = await pool.query(query, [hostnameId, start, end]);
          return {
              data: rows as any[],
              totalAvg: totalAvg
          };
      } catch (e) { 
          console.error(`Database Error:`, e); 
          return { data: [], totalAvg: 0 }; 
      }
  }

  static async getMemMonthly(hostgroup: string, hostnameId: number, month: string, year: string): Promise<any[]> {
      const tableName = `${hostgroup}:r`;
      const query = `SELECT TIME_FORMAT(time,'%H:%i') as time_label, DAY(time) as day, mem as val 
                     FROM \`${tableName}\` 
                     WHERE hostname_id = ? AND MONTH(time) = ? AND YEAR(time) = ? 
                     ORDER BY time ASC`;
      try {
          const [rows] = await pool.query(query, [hostnameId, month, year]);
          return rows as any[];
      } catch (e) { console.error(`Database Error:`, e); return []; }
  }

  static async getHostGroups(): Promise<any[]> {
    const query = `
      SELECT hg.hostgroup_id, hg.hostgroup, hn.hostname_id, hn.hostname, hn.mem, hn.pagesize 
      FROM hostgroup hg 
      LEFT JOIN hostname hn ON hg.hostgroup_id = hn.hostgroup_id
      ORDER BY hg.hostgroup ASC
    `;
    try {
      const [rows] = await pool.query(query);
      const hostgroups: any[] = [];
      (rows as any[]).forEach(row => {
        let group = hostgroups.find(g => g.hostgroup_id === row.hostgroup_id);
        if (!group) {
          group = { hostgroup_id: row.hostgroup_id, hostgroup: row.hostgroup, hostnames: [] };
          hostgroups.push(group);
        }
        if (row.hostname_id) {
          group.hostnames.push({ hostname_id: row.hostname_id, hostname: row.hostname, mem: row.mem, pagesize: row.pagesize });
        }
      });
      return hostgroups;
    } catch (e) {
      console.error('Failed to fetch hostgroups:', e);
      return [];
    }
  }
}
