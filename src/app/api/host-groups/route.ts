
import { NextResponse } from 'next/server';
import { MetricService } from '@/lib/services/MetricService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hostgroups = await MetricService.getHostGroups();
    return NextResponse.json(hostgroups);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
