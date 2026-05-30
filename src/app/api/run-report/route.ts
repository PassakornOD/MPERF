import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

export async function POST(request: Request) {
    const { month, year, filters, templateId } = await request.json();
    
    if (!month || !year) {
        return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 });
    }

    const jobId = uuidv4();
    let projectRoot = process.cwd();
    // Detect if we are in the workspace root instead of MPERF dir
    if (fs.existsSync(path.join(projectRoot, 'MPERF/package.json'))) {
        projectRoot = path.join(projectRoot, 'MPERF');
    }

    const statusDir = path.join(projectRoot, 'public/reports/jobs');
    if (!fs.existsSync(statusDir)) fs.mkdirSync(statusDir, { recursive: true });

    const logFile = path.join(statusDir, 'api.log');
    const log = (msg: string) => {
        const entry = `[${new Date().toISOString()}] ${msg}\n`;
        fs.appendFileSync(logFile, entry);
        console.log(msg);
    };

    log(`[POST] Triggering job ${jobId} for Template: ${templateId}, Month: ${month}, Year: ${year}`);

    // Fetch template name if possible to show in UI immediately
    let templateName = 'Manual Report';
    if (templateId) {
        try {
            const [rows]: any = await pool.query('SELECT name FROM report_templates WHERE id = ?', [templateId]);
            if (rows.length > 0) {
                templateName = rows[0].name;
                log(`[POST] Found template name: ${templateName}`);
            }
        } catch (e: any) {
            log(`[POST] Failed to fetch template name: ${e.message}`);
        }
    }

    const statusFile = path.join(statusDir, `${jobId}.json`);
    const initialStatus = {
        id: jobId,
        status: 'pending',
        progress: 0,
        templateId: templateId || 'manual',
        templateName,
        month,
        year,
        timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false }),
        message: 'Job initialized'
    };
    
    fs.writeFileSync(statusFile, JSON.stringify(initialStatus));
    log(`[POST] Created status file: ${statusFile}`);

    let command = `npm run generate-monthly-report -- --month=${month} --year=${year} --jobId=${jobId}`;
    if (templateId) {
        command += ` --templateId=${templateId}`;
    } else if (filters) {
        command += ` --filters="${filters}"`;
    }
    
    log(`[POST] Executing: ${command} in ${projectRoot}`);

    // Run in background
    exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (stdout) log(`[Job ${jobId}] STDOUT: ${stdout}`);
        if (stderr) log(`[Job ${jobId}] STDERR: ${stderr}`);
        
        if (error) {
            log(`[Job ${jobId}] Error: ${error.message}`);
            try {
                const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
                status.status = 'failed';
                status.message = error.message;
                fs.writeFileSync(statusFile, JSON.stringify(status));
            } catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                log(`[Job ${jobId}] Failed to update status file on error: ${errorMessage}`);
            }
        }
    });

    return NextResponse.json({ jobId, message: 'Report generation started in background' });
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    if (!month || !year) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const fileName = `MFEC_SAR_Full_Report_${year}_${String(month).padStart(2, '0')}.pdf`;
    const filePath = path.join(process.cwd(), 'public', 'reports', 'monthly', `${year}_${month}`, fileName);
    
    return NextResponse.json({ exists: fs.existsSync(filePath) });
}
