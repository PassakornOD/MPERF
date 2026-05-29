import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: Request) {
    const { filePath } = await request.json();
    if (!filePath) return NextResponse.json({ error: 'File path is required' }, { status: 400 });

    // 1. หาชื่อไฟล์จาก path (เอาเฉพาะชื่อไฟล์ท้ายสุด)
    const fileName = path.basename(filePath);
    
    // 2. ค้นหาไฟล์ในโฟลเดอร์ที่คาดว่าจะอยู่ (กว้างขึ้นเป็น public/reports)
    const searchDir = path.join(process.cwd(), 'public/reports');
    
    // ค้นหาแบบ recursive ว่าไฟล์ชื่อนี้อยู่ไหน
    const findFile = (dir: string, name: string): string | null => {
        if (!fs.existsSync(dir)) {
            console.log(`[Debug] Dir does not exist: ${dir}`);
            return null;
        }
        const files = fs.readdirSync(dir);
        console.log(`[Debug] Dir: ${dir}, Files found: ${JSON.stringify(files)}`);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                const found = findFile(fullPath, name);
                if (found) return found;
            } else if (file === name) {
                console.log(`[Debug] File found! ${fullPath}`);
                return fullPath;
            }
        }
        return null;
    };

    try {
        const targetFile = findFile(searchDir, fileName);

        if (targetFile) {
            fs.unlinkSync(targetFile);

            // 3. หาและลบไฟล์ status JSON ที่ตรงกับ pdfPath นี้
            const statusDir = path.join(process.cwd(), 'public/reports/jobs');
            if (fs.existsSync(statusDir)) {
                const jobFiles = fs.readdirSync(statusDir);
                for (const jobFile of jobFiles) {
                    if (jobFile.endsWith('.json')) {
                        const jobPath = path.join(statusDir, jobFile);
                        const jobContent = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
                        
                        // ตรวจสอบว่า json file นี้ชี้ไปที่ไฟล์ PDF ที่ลบไปหรือไม่
                        // ใช้ filePath เดิมจาก request body
                        if (jobContent.pdfPath === filePath) {
                            fs.unlinkSync(jobPath);
                            console.log(`[Delete] Deleted corresponding status file: ${jobPath}`);
                        }
                    }
                }
            }

            return NextResponse.json({ message: 'File and status deleted successfully' });
        } else {
            console.error(`[Delete] File not found in searchDir: ${searchDir}, fileName: ${fileName}`);
            return NextResponse.json({ error: 'File not found in system' }, { status: 404 });
        }
    } catch (error) {
        console.error('[Delete] Internal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
