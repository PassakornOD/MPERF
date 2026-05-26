import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'sarlog',
};

async function sync() {
    console.log('Starting directory synchronization...');
    const pool = mysql.createPool(dbConfig);

    try {
        const query = `
            SELECT hg.hostgroup, hn.hostname, hn.OS 
            FROM hostname hn 
            JOIN hostgroup hg ON hn.hostgroup_id = hg.hostgroup_id
        `;
        const [rows]: any = await pool.query(query);
        console.log(`Found ${rows.length} hostnames in database.`);

        // Determine base path (support Docker and Local)
        const possiblePaths = [
            path.join(process.cwd(), 'data_RedHat'),
            path.join(process.cwd(), '..', 'data_RedHat'),
            path.join('/app', 'data_RedHat')
        ];
        
        let rootPath = '';
        for (const p of possiblePaths) {
            if (fs.existsSync(path.dirname(p))) {
                rootPath = path.dirname(p);
                break;
            }
        }
        if (!rootPath) rootPath = process.cwd();

        console.log(`Using root path: ${rootPath}`);

        for (const row of rows) {
            const isRedHat = row.OS.toLowerCase().includes('red hat') || row.OS.toLowerCase().includes('redhat');
            const osDir = isRedHat ? 'data_RedHat' : 'data_Solaris';
            
            const cpuPath = path.join(rootPath, osDir, row.hostgroup, row.hostname, 'sar-u');
            const memPath = path.join(rootPath, osDir, row.hostgroup, row.hostname, 'sar-r');

            let created = false;
            if (!fs.existsSync(cpuPath)) {
                fs.mkdirSync(cpuPath, { recursive: true });
                created = true;
            }
            if (!fs.existsSync(memPath)) {
                fs.mkdirSync(memPath, { recursive: true });
                created = true;
            }

            if (created) {
                console.log(`[Created] ${osDir}/${row.hostgroup}/${row.hostname}`);
            }
        }

        console.log('Synchronization completed successfully.');
    } catch (error) {
        console.error('Synchronization failed:', error);
    } finally {
        await pool.end();
    }
}

sync();
