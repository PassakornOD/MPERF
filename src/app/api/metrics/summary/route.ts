import { NextRequest, NextResponse } from 'next/server';
import { MetricService } from '@/lib/services/MetricService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const hostgroup = searchParams.get('hostgroup') || '';
  const hostnameId = searchParams.get('hostnameId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!hostgroup || !hostnameId || !month || !year) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const cpuSummary = await MetricService.getCpuStatsSummary(Number(user.id), user.role, hostgroup, Number(hostnameId), month, year);
    const memSummary = await MetricService.getMemStatsSummary(Number(user.id), user.role, hostgroup, Number(hostnameId), month, year);
    
    return NextResponse.json({
        cpuStats: cpuSummary,
        memStats: memSummary
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
