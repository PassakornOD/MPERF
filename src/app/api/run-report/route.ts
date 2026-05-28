import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
    const { month, year, filters } = await request.json();
    
    if (!month || !year) {
        return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 });
    }

    let command = `reportlargepdf --month=${month} --year=${year}`;
    if (filters) {
        command += ` --filters="${filters}"`;
    }
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
        }
    });

    return NextResponse.json({ message: 'Report generation started in background' });
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
