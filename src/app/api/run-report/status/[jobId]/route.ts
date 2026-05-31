import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;
    if (!jobId) return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });

    let projectRoot = process.cwd();
    if (fs.existsSync(path.join(projectRoot, 'MPERF/package.json'))) {
        projectRoot = path.join(projectRoot, 'MPERF');
    }

    const statusFile = path.join(projectRoot, 'public/reports/jobs', `${jobId}.json`);
    const tmpDir = path.join(projectRoot, 'public/reports/tmp', jobId);

    try {
        if (fs.existsSync(statusFile)) fs.unlinkSync(statusFile);
        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
        return NextResponse.json({ message: 'Job deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }
}
