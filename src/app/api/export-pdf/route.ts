import { NextRequest, NextResponse } from 'next/server';
import { ReportPayload } from '@/types/report';
import { PdfGeneratorService } from '@/lib/services/PdfGeneratorService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const payload: ReportPayload = JSON.parse(body);

    if (!payload || !payload.hostgroups) throw new Error('Invalid payload structure');

    const pdfBuffer = await PdfGeneratorService.generatePdfBuffer(payload);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' }
    });
  } catch (error: any) {
    console.error('[PDF Export Error]:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
