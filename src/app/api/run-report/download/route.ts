import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
        return new NextResponse('File path required', { status: 400 });
    }

    // กำหนด Path เต็มตามโครงสร้างใน Docker
    // ต้องระวัง: filePath ที่ได้รับมาอาจมีหรือไม่มี / นำหน้า
    const relativePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(process.cwd(), relativePath);

    if (!fs.existsSync(fullPath)) {
        console.error(`[Download] File not found: ${fullPath}`);
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(fullPath);
        
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${path.basename(fullPath)}"`,
            },
        });
    } catch (error) {
        console.error('[Download] Error reading file:', error);
        return new NextResponse('Error reading file', { status: 500 });
    }
}
