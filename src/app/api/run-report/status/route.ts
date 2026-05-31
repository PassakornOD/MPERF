import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { AutomationService } from '@/lib/services/AutomationService';

export async function GET() {
    AutomationService.init();

    let projectRoot = process.cwd();
    // Detect if we are in the workspace root instead of MPERF dir
    if (fs.existsSync(path.join(projectRoot, 'MPERF/package.json'))) {
        projectRoot = path.join(projectRoot, 'MPERF');
    }

    const statusDir = path.join(projectRoot, 'public/reports/jobs');
    
    if (!fs.existsSync(statusDir)) {
        return NextResponse.json([]);
    }

    try {
        const files = fs.readdirSync(statusDir)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                try {
                    const content = fs.readFileSync(path.join(statusDir, f), 'utf8');
                    const job = JSON.parse(content);
                    
                    // Stale detection
                    if (job.status === 'processing') {
                        const lastUpdated = new Date(job.timestamp).getTime();
                        if (Date.now() - lastUpdated > 5 * 60 * 1000) {
                            job.status = 'stale';
                            job.message = 'Job appears to be stuck (no updates for > 5 minutes).';
                        }
                    }
                    return job;
                } catch (e) {
                    return null;
                }
            })
            .filter(j => j !== null)
            .sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
            });

        return NextResponse.json(files.slice(0, 20));
    } catch (error: any) {
        console.error('Failed to read job status:', error);
        return NextResponse.json({ error: 'Failed to fetch job status' }, { status: 500 });
    }
}
