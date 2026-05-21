
import { NextResponse } from 'next/server';
import { MetricService } from '@/lib/services/MetricService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const user = session.user as any;
  try {
    const hostgroups = await MetricService.getHostGroups(Number(user.id), user.role);
    return NextResponse.json(hostgroups);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
