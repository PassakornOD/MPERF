import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    const { jobId } = await request.json();
    if (!jobId) return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });

    let projectRoot = process.cwd();
    if (fs.existsSync(path.join(projectRoot, 'MPERF/package.json'))) {
        projectRoot = path.join(projectRoot, 'MPERF');
    }

    const statusFile = path.join(projectRoot, 'public/reports/jobs', `${jobId}.json`);
    if (!fs.existsSync(statusFile)) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const job = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    
    // Create new job
    const newJobId = uuidv4();
    const newStatusFile = path.join(projectRoot, 'public/reports/jobs', `${newJobId}.json`);
    
    const initialStatus = {
        ...job,
        id: newJobId,
        status: 'pending',
        progress: 0,
        timestamp: new Date().toISOString(),
        message: `Retrying from job ${jobId}`
    };
    
    fs.writeFileSync(newStatusFile, JSON.stringify(initialStatus));

    let command = `npm run generate-monthly-report -- --month=${job.month} --year=${job.year} --jobId=${newJobId}`;
    if (job.templateId && job.templateId !== 'manual') {
        command += ` --templateId=${job.templateId}`;
    }
    
    exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
            const status = JSON.parse(fs.readFileSync(newStatusFile, 'utf8'));
            status.status = 'failed';
            status.message = error.message;
            fs.writeFileSync(newStatusFile, JSON.stringify(status));
        }
    });

    return NextResponse.json({ jobId: newJobId, message: 'Retry started' });
}
