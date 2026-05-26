import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SarIngestionService, IngestOptions } from '@/lib/services/SarIngestionService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const options: IngestOptions = {
        ...body,
        day: body.date || body.day,
        dataType: body.dataType
    };
    
    // Trigger ingestion
    const results = await SarIngestionService.ingest(options, user);

    return NextResponse.json({ 
      message: 'Ingestion completed', 
      results 
    });
  } catch (error: any) {
    console.error('API Ingestion Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to ingest data' }, { status: 500 });
  }
}
