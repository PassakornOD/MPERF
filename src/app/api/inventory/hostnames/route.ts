import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const hostgroup_id = searchParams.get('hostgroup_id');
  
  let query = `SELECT h.* 
                FROM hostname h
                LEFT JOIN hostgroup hg ON h.hostgroup_id = hg.hostgroup_id`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (user.role !== 'admin') {
    whereClauses.push(`h.hostgroup_id IN (
        SELECT pgh.hostgroup_id 
        FROM user_to_user_groups uug
        JOIN ug_permission_groups upg ON uug.ug_id = upg.ug_id
        JOIN pg_hostgroups pgh ON upg.pg_id = pgh.pg_id
        WHERE uug.user_id = ?
    )`);
    params.push(user.id);
  }
  
  if (hostgroup_id) {
    whereClauses.push('h.hostgroup_id = ?');
    params.push(Number(hostgroup_id));
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }
  
  query += ' ORDER BY h.hostname ASC';

  try {
    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Hostname API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch hostnames' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !checkPermission(user.role, 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const connection = await pool.getConnection();
  try {
    const data = await req.json();
    const { hostname, hostgroup_id, System, Location, IP, Model, CPU, Disk, OS, Serial, MA, mem, Pagesize } = data;
    
    if (user.role !== 'admin') {
        const [access]: any = await connection.query(`
            SELECT 1 FROM user_to_user_groups uug 
            JOIN ug_permission_groups upg ON uug.ug_id = upg.ug_id 
            JOIN pg_hostgroups pgh ON upg.pg_id = pgh.pg_id 
            WHERE uug.user_id = ? AND pgh.hostgroup_id = ?`,
            [user.id, Number(hostgroup_id)]
        );
        if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!hostname || !hostgroup_id || !OS || mem === '' || !Pagesize) {
        return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    await connection.beginTransaction();
    const [result]: any = await connection.query(
      `INSERT INTO hostname (hostname, hostgroup_id, System, Location, IP, Model, CPU, Disk, OS, Serial, MA, mem, Pagesize, Time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [hostname, Number(hostgroup_id), System || '', Location || '', IP || '', Model || '', CPU || '', Disk || '', OS, Serial || '', MA || '', Number(mem), Number(Pagesize)]
    );


    const hostnameId = result.insertId;
    const cpuTable = `${hostname}:u`;
    const memTable = `${hostname}:r`;

    const isRedHat = OS.toLowerCase().includes('red hat') || OS.toLowerCase().includes('redhat');
    let createCpuSql = isRedHat 
        ? "CREATE TABLE `" + cpuTable + "` (`time` datetime NOT NULL, `usr` float NOT NULL, `nice` float NOT NULL, `sys` float NOT NULL, `wio` float NOT NULL, `steal` float NOT NULL, `idle` float NOT NULL, `hostname_id` int NOT NULL, PRIMARY KEY (`time`, `hostname_id`)) ENGINE=InnoDB"
        : "CREATE TABLE `" + cpuTable + "` (`time` datetime NOT NULL, `usr` float NOT NULL, `sys` float NOT NULL, `wio` float NOT NULL, `idle` float NOT NULL, `hostname_id` int NOT NULL, PRIMARY KEY (`time`, `hostname_id`)) ENGINE=InnoDB";

    await connection.query(createCpuSql);
    await connection.query("CREATE TABLE `" + memTable + "` (`time` datetime NOT NULL, `mem` float NOT NULL, `hostname_id` int NOT NULL, PRIMARY KEY (`time`, `hostname_id`)) ENGINE=InnoDB");

    await connection.commit();
    return NextResponse.json({ message: 'Created', id: hostnameId });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !checkPermission(user.role, 'update')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const data = await req.json();
        const { hostname_id, hostgroup_id } = data;
        
        if (user.role !== 'admin') {
            const [access]: any = await pool.query(`
                SELECT 1 FROM user_to_user_groups uug 
                JOIN ug_permission_groups upg ON uug.ug_id = upg.ug_id 
                JOIN pg_hostgroups pgh ON upg.pg_id = pgh.pg_id 
                WHERE uug.user_id = ? AND pgh.hostgroup_id = ?`,
                [user.id, Number(hostgroup_id)]
            );
            if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await pool.query(
          `UPDATE hostname SET hostname = ?, hostgroup_id = ?, System = ?, Location = ?, IP = ?, Model = ?, CPU = ?, Disk = ?, OS = ?, Serial = ?, MA = ?, mem = ?, Pagesize = ? 
           WHERE hostname_id = ?`,
          [data.hostname, Number(hostgroup_id), data.System || '', data.Location || '', data.IP || '', data.Model || '', data.CPU || '', data.Disk || '', data.OS, data.Serial || '', data.MA || '', Number(data.mem), Number(data.Pagesize), hostname_id]
        );
    
        return NextResponse.json({ message: 'Hostname updated' });
      } catch (error) {
        return NextResponse.json({ error: 'Failed to update hostname' }, { status: 500 });
      }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !checkPermission(user.role, 'delete')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        const [h]: any = await connection.query('SELECT hostname, hostgroup_id FROM hostname WHERE hostname_id = ?', [id]);
        if (h.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        
        if (user.role !== 'admin') {
            const [access]: any = await connection.query(`
                SELECT 1 FROM user_to_user_groups uug 
                JOIN ug_permission_groups upg ON uug.ug_id = upg.ug_id 
                JOIN pg_hostgroups pgh ON upg.pg_id = pgh.pg_id 
                WHERE uug.user_id = ? AND pgh.hostgroup_id = ?`,
                [user.id, Number(h[0].hostgroup_id)]
            );
            if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    
        const cpuTable = `${h[0].hostname}:u`;
        const memTable = `${h[0].hostname}:r`;
    
        await connection.beginTransaction();
        await connection.query('DELETE FROM hostname WHERE hostname_id = ?', [id]);
        await connection.query(`DROP TABLE IF EXISTS \`` + cpuTable + `\``);
        await connection.query(`DROP TABLE IF EXISTS \`` + memTable + `\``);
    
        await connection.commit();
        return NextResponse.json({ message: 'Deleted' });
      } catch (error) {
        await connection.rollback();
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
      } finally {
        connection.release();
      }
}
