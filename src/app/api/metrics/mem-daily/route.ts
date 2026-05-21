
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
  const type = searchParams.get('type') as 'Peak' | 'Normal';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!hostgroup || !hostnameId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const data = await MetricService.getMemDaily(
      Number(user.id),
      user.role,
      hostgroup,
      Number(hostnameId),
      type || 'Normal',
      startDate,
      endDate
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
