
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hostgroup_id = searchParams.get('hostgroup_id');
  
  let query = 'SELECT * FROM hostname';
  const params = [];
  
  if (hostgroup_id) {
    query += ' WHERE hostgroup_id = ?';
    params.push(hostgroup_id);
  }
  
  query += ' ORDER BY hostname ASC';

  try {
    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch hostnames' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const data = await req.json();
    const { hostname, hostgroup_id, System, Location, IP, Model, CPU, Disk, OS, Serial, MA, mem, Pagesize } = data;
    
    if (!hostname || !hostgroup_id || !OS || mem === '' || !Pagesize) {
        return NextResponse.json({ error: 'Hostname, Hostgroup, OS, RAM, and Pagesize are required' }, { status: 400 });
    }

    await connection.beginTransaction();

    // 1. Insert into hostname table
    const [result]: any = await connection.query(
      `INSERT INTO hostname (\`hostname\`, \`hostgroup_id\`, \`System\`, \`Location\`, \`IP\`, \`Model\`, \`CPU\`, \`Disk\`, \`OS\`, \`Serial\`, \`MA\`, \`mem\`, \`Pagesize\`, \`Time\`) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [hostname, Number(hostgroup_id), System || '', Location || '', IP || '', Model || '', CPU || '', Disk || '', OS, Serial || '', MA || '', Number(mem), Number(Pagesize)]
    );

    const hostnameId = result.insertId;
    const cpuTable = `${hostname}:u`;
    const memTable = `${hostname}:r`;

    // 2. Create CPU Table based on OS
    const isRedHat = OS.toLowerCase().includes('red hat') || OS.toLowerCase().includes('redhat');
    let createCpuSql = '';
    
    if (isRedHat) {
      createCpuSql = `CREATE TABLE \`${cpuTable}\` (
        \`time\` datetime NOT NULL,
        \`usr\` float NOT NULL,
        \`nice\` float NOT NULL,
        \`sys\` float NOT NULL,
        \`wio\` float NOT NULL,
        \`steal\` float NOT NULL,
        \`idle\` float NOT NULL,
        \`hostname_id\` int NOT NULL,
        PRIMARY KEY (\`time\`, \`hostname_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3`;
    } else {
      createCpuSql = `CREATE TABLE \`${cpuTable}\` (
        \`time\` datetime NOT NULL,
        \`usr\` float NOT NULL,
        \`sys\` float NOT NULL,
        \`wio\` float NOT NULL,
        \`idle\` float NOT NULL,
        \`hostname_id\` int NOT NULL,
        PRIMARY KEY (\`time\`, \`hostname_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3`;
    }

    await connection.query(createCpuSql);

    // 3. Create Memory Table
    const createMemSql = `CREATE TABLE \`${memTable}\` (
      \`time\` datetime NOT NULL,
      \`mem\` float NOT NULL,
      \`hostname_id\` int NOT NULL,
      PRIMARY KEY (\`time\`, \`hostname_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3`;

    await connection.query(createMemSql);

    await connection.commit();
    return NextResponse.json({ message: 'Hostname created and tables initialized', id: hostnameId });
  } catch (error) {
    await connection.rollback();
    console.error('Operation Failed:', error);
    return NextResponse.json({ error: 'Failed to create hostname or initialize tables' }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { hostname_id, hostname, hostgroup_id, System, Location, IP, Model, CPU, Disk, OS, Serial, MA, mem, Pagesize } = data;
    
    if (!hostname_id || !hostname || !hostgroup_id || !OS || mem === '' || !Pagesize) {
        return NextResponse.json({ error: 'Required fields missing for update' }, { status: 400 });
    }

    await pool.query(
      `UPDATE hostname SET \`hostname\` = ?, \`hostgroup_id\` = ?, \`System\` = ?, \`Location\` = ?, \`IP\` = ?, \`Model\` = ?, \`CPU\` = ?, \`Disk\` = ?, \`OS\` = ?, \`Serial\` = ?, \`MA\` = ?, \`mem\` = ?, \`Pagesize\` = ? 
       WHERE \`hostname_id\` = ?`,
      [hostname, Number(hostgroup_id), System || '', Location || '', IP || '', Model || '', CPU || '', Disk || '', OS, Serial || '', MA || '', Number(mem), Number(Pagesize), hostname_id]
    );

    return NextResponse.json({ message: 'Hostname updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update hostname' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    // Get hostname before deleting
    const [rows]: any = await connection.query('SELECT hostname FROM hostname WHERE hostname_id = ?', [id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Hostname not found' }, { status: 404 });
    
    const hostname = rows[0].hostname;
    const cpuTable = `${hostname}:u`;
    const memTable = `${hostname}:r`;

    await connection.beginTransaction();

    // 1. Delete from hostname table
    await connection.query('DELETE FROM hostname WHERE hostname_id = ?', [id]);

    // 2. Drop tables
    await connection.query(`DROP TABLE IF EXISTS \`${cpuTable}\``);
    await connection.query(`DROP TABLE IF EXISTS \`${memTable}\``);

    await connection.commit();
    return NextResponse.json({ message: 'Hostname and associated tables deleted' });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ error: 'Failed to delete hostname or tables' }, { status: 500 });
  } finally {
    connection.release();
  }
}
