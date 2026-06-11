import pool from '../db';
import fs from 'fs';
import path from 'path';

export interface IngestOptions {
    hostgroup?: string;
    hostname?: string;
    month?: string; // e.g., "May"
    day?: string;   // e.g., "12 May" or "yesterday"
    os?: 'RedHat' | 'Solaris';
    dataType?: 'cpu' | 'mem' | 'All';
}

export class SarIngestionService {
    private static MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    static async ingest(options: IngestOptions, user: any) {
        const { hostgroup, hostname, month, day, os, dataType } = options;

        const currentYear = new Date().getFullYear();
        let targetDateStr = ''; // YYYY-MM-DD
        const username = user?.email || 'system';

        if (day && day.includes('-')) {
            targetDateStr = day; // รองรับ YYYY-MM-DD โดยตรง
        } else if (day === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            targetDateStr = yesterday.toISOString().split('T')[0];
        } else if (day && day.includes(' ')) {
            // Expecting "12 May"
            const [d, m] = day.split(' ');
            const mIdx = this.MONTHS.indexOf(m);
            if (mIdx !== -1) {
                const dateObj = new Date(currentYear, mIdx, parseInt(d));
                targetDateStr = dateObj.toISOString().split('T')[0];
            }
        }

        const osDirs = ['data_RedHat', 'data_Solaris'].filter(d => !os || d.toLowerCase().includes(os.toLowerCase()));
        const results: string[] = [];



        for (const osDir of osDirs) {
            const possiblePaths = [
                path.join(process.cwd(), '..', osDir),
                path.join(process.cwd(), osDir),
                path.join('/app', osDir)
            ];

            let actualOsPath = '';
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    actualOsPath = p;
                    break;
                }
            }



            const isSolaris = osDir.includes('Solaris');
            const hostgroups = fs.readdirSync(actualOsPath).filter(d => fs.statSync(path.join(actualOsPath, d)).isDirectory());

            for (const hg of hostgroups) {
                if (hostgroup && hg !== hostgroup) continue;

                const hgPath = path.join(actualOsPath, hg);
                const hostnames = fs.readdirSync(hgPath).filter(d => fs.statSync(path.join(hgPath, d)).isDirectory());

                for (const hn of hostnames) {
                    if (hostname && hn !== hostname) continue;


                    // Get hostname info from DB
                    const [rows]: any = await pool.query('SELECT hostname_id, mem, Pagesize FROM hostname WHERE hostname = ?', [hn]);
                    if (rows.length === 0) {
                        continue;
                    }
                    const hostInfo = rows[0];

                    const hnPath = path.join(hgPath, hn);

                    // CPU (sar-u)
                    if (!dataType || dataType === 'All' || dataType === 'cpu') {
                        const cpuPath = path.join(hnPath, 'sar-u');
                        if (fs.existsSync(cpuPath)) {
                            const files = fs.readdirSync(cpuPath).filter(f => {
                                if (targetDateStr) {
                                    const dateObj = new Date(targetDateStr);
                                    const dNum = dateObj.getDate();
                                    const mStr = this.MONTHS[dateObj.getMonth()];
                                    const regex = new RegExp(`^0?${dNum}${mStr}\\.sar-u$`, 'i');
                                    return regex.test(f);
                                }
                                if (month) return f.includes(month);
                                return true;
                            });
                            for (const file of files) {
                                const res = await this.processFile(path.join(cpuPath, file), hg, hn, hostInfo, 'u', isSolaris, targetDateStr || currentYear.toString(), username);
                                if (res) results.push(res);
                            }
                        }
                    }

                    // Memory (sar-r or .mem)
                    if (!dataType || dataType === 'All' || dataType === 'mem') {
                        const memPath = path.join(hnPath, 'sar-r');
                        if (fs.existsSync(memPath)) {
                            const files = fs.readdirSync(memPath).filter(f => {
                                if (targetDateStr) {
                                    const dateObj = new Date(targetDateStr);
                                    const dNum = dateObj.getDate();
                                    const mStr = this.MONTHS[dateObj.getMonth()];
                                    const ext = isSolaris ? '\\.sar-r' : '\\.mem';
                                    const regex = new RegExp(`^0?${dNum}${mStr}${ext}$`, 'i');
                                    return regex.test(f);
                                }
                                if (month) return f.includes(month);
                                return true;
                            });
                            for (const file of files) {
                                const res = await this.processFile(path.join(memPath, file), hg, hn, hostInfo, 'r', isSolaris, targetDateStr || currentYear.toString(), username);
                                if (res) results.push(res);
                            }
                        }
                    }
                }
            }
        }
        return results;
    }

    private static async processFile(filePath: string, hostgroup: string, hostname: string, hostInfo: any, type: 'u' | 'r', isSolaris: boolean, yearOrDate: string, username: string) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const tableName = `\`${hostgroup}:${type}\``;

        if (lines.length < 2) {
            await pool.query('INSERT INTO insertion_logs (user, table_name, status, records_processed, message) VALUES (?, ?, ?, ?, ?)', [username, tableName, 'Skip', 0, `No data in ${filePath}`]);
            return null;
        }

        let tmpDate = '';
        if (yearOrDate.includes('-')) {
            tmpDate = yearOrDate;
        } else {
            if (!isSolaris) {
                if (type === 'u') {
                    const cols = lines[0].split(/\s+/);
                    const rawDate = cols[3];
                    if (rawDate && rawDate.includes('/')) {
                        const p = rawDate.split('/');
                        tmpDate = `${p[2]}-${p[0]}-${p[1]}`;
                    }
                } else {
                    const firstCol = lines[0].split(/\s+/)[0];
                    if (firstCol.includes('/')) {
                        const p = firstCol.split('/');
                        tmpDate = p[2].length === 4 ? `${p[2]}-${p[0]}-${p[1]}` : `20${p[2]}-${p[0]}-${p[1]}`;
                    }
                }
            } else {
                // Solaris
                const header = lines[0];
                const dateMatch = header.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (dateMatch) {
                    const [_, m, d, y] = dateMatch;
                    tmpDate = `${y}-${m}-${d}`;
                }
            }
        }

        if (!tmpDate) {
            const filename = path.basename(filePath);
            const match = filename.match(/(\d+)([A-Za-z]+)/);
            if (match) {
                const d = match[1].padStart(2, '0');
                const m = (this.MONTHS.indexOf(match[2]) + 1).toString().padStart(2, '0');
                const y = yearOrDate.includes('-') ? yearOrDate.split('-')[0] : yearOrDate;
                tmpDate = `${y}-${m}-${d}`;
            }
        }

        if (!tmpDate) {
            await pool.query('INSERT INTO insertion_logs (user, table_name, status, records_processed, message) VALUES (?, ?, ?, ?, ?)', [username, tableName, 'Skip', 0, `Date unknown in ${filePath}`]);
            return `[Skip] ${filePath}: Date unknown`;
        }

        // Dynamic detection of start line
        let startLine = 0;
        const timePattern = /^(\d{2}:\d{2}(:\d{2})?)/;
        for (let i = 0; i < lines.length; i++) {
            if (timePattern.test(lines[i])) {
                startLine = i;
                break;
            }
        }

        const dataToInsert: any[] = [];
        const seenRecords = new Set<string>(); // Strict deduplication set

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];

            const cols = line.split(/\s+/);
            if (cols.length < 2) {
                continue;
            }

            let timePart = '';
            let dataOffset = 0;

            if (!isSolaris) {
                // Check if first column is a date (e.g., 05/12/2026)
                if (cols[0].includes('/')) {
                    timePart = cols[1];
                    dataOffset = 1;
                } else {
                    timePart = cols[0];
                    dataOffset = 0;
                }

                // Check for AM/PM marker (e.g., 12:00:00 AM)
                if (cols[dataOffset + 1] === 'AM' || cols[dataOffset + 1] === 'PM') {
                    timePart += ' ' + cols[dataOffset + 1];
                    dataOffset += 1;
                }
            } else {
                timePart = cols[0];
                dataOffset = 0;
            }

            let cleanTime = '';
            try {
                let hh = 0, mm = 0, ss = 0;
                const ampmMatch = timePart.match(/(AM|PM)/i);
                const timeOnly = timePart.replace(/(AM|PM)/i, '').trim();
                const parts = timeOnly.split(':');

                if (parts.length >= 2) {
                    hh = parseInt(parts[0]);
                    mm = parseInt(parts[1]);
                    ss = parts.length >= 3 ? parseInt(parts[2]) : 0;

                    if (ampmMatch) {
                        const ampm = ampmMatch[0].toUpperCase();
                        if (ampm === 'PM' && hh < 12) hh += 12;
                        if (ampm === 'AM' && hh === 12) hh = 0;
                    }

                    cleanTime = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
                }
            } catch (e) { continue; }
            if (!cleanTime) continue;

            const timestamp = `${tmpDate} ${cleanTime}`;

            // --- Deduplication Logic ---
            const uniqueRowKey = `${timestamp}|${hostInfo.hostname_id}`;
            if (seenRecords.has(uniqueRowKey)) continue;
            seenRecords.add(uniqueRowKey);
            // ---------------------------

            if (type === 'u') {
                if (isSolaris) {
                    if (cols.length >= 5) {
                        const vals = [parseFloat(cols[1]), parseFloat(cols[2]), parseFloat(cols[3]), parseFloat(cols[4])];
                        if (vals.every(v => isFinite(v))) {
                            dataToInsert.push([timestamp, ...vals, hostInfo.hostname_id]);
                        }
                    }
                } else {
                    const startIdx = dataOffset + 2;
                    if (cols.length >= startIdx + 6) {
                        const vals = [
                            parseFloat(cols[startIdx]),
                            parseFloat(cols[startIdx + 1]),
                            parseFloat(cols[startIdx + 2]),
                            parseFloat(cols[startIdx + 3]),
                            parseFloat(cols[startIdx + 4]),
                            parseFloat(cols[startIdx + 5])
                        ];
                        if (vals.every(v => isFinite(v))) {
                            dataToInsert.push([timestamp, ...vals, hostInfo.hostname_id]);
                        }
                    }
                }
            } else {
                const rawMem = parseFloat(cols[dataOffset + 1]);
                if (isFinite(rawMem)) {
                    let finalMem = 0;
                    if (!isSolaris) {
                        finalMem = hostInfo.mem - (rawMem / 1024);
                    } else {
                        finalMem = hostInfo.mem - (rawMem * hostInfo.Pagesize / (1024 * 1024 * 1024));
                    }
                    dataToInsert.push([timestamp, finalMem, hostInfo.hostname_id]);
                }
            }
        }

        if (dataToInsert.length > 0) {
            const query = type === 'u'
                ? (isSolaris
                    ? `INSERT IGNORE INTO ${tableName} (time, usr, sys, wio, idle, hostname_id) VALUES ?`
                    : `INSERT IGNORE INTO ${tableName} (time, usr, nice, sys, wio, steal, idle, hostname_id) VALUES ?`)
                : `INSERT IGNORE INTO ${tableName} (time, mem, hostname_id) VALUES ?`;

            try {
                const [result] = await pool.query(query, [dataToInsert]) as any;
                const affectedRows = result.affectedRows || 0;
                await pool.query('INSERT INTO insertion_logs (user, table_name, status, records_processed, message) VALUES (?, ?, ?, ?, ?)', [username, tableName, 'Success', affectedRows, `Processed ${filePath}. Actual inserted: ${affectedRows}`]);
                return `[Success] ${filePath}: Inserted ${affectedRows} rows`;
            } catch (err: any) {
                await pool.query('INSERT INTO insertion_logs (user, table_name, status, records_processed, message) VALUES (?, ?, ?, ?, ?)', [username, tableName, 'Error', 0, `${err.message} in ${filePath}`]);
                return `[Error] ${filePath}: ${err.message}`;
            }
        }
        await pool.query('INSERT INTO insertion_logs (user, table_name, status, records_processed, message) VALUES (?, ?, ?, ?, ?)', [username, tableName, 'Skip', 0, `No data found in ${filePath}`]);
        return `[Skip] ${filePath}: No data found`;
    }
}

