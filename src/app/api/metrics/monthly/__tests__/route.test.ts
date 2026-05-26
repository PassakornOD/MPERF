import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { MetricService } from '@/lib/services/MetricService';

vi.mock('next-auth', () => ({ 
  default: vi.fn(),
  getServerSession: vi.fn() 
}));
vi.mock('@/lib/services/MetricService', () => ({ 
  MetricService: { 
    getCpuMonthly: vi.fn(),
    getMemMonthly: vi.fn() 
  } 
}));
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }));

describe('Monthly Metrics API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('returns data on success', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 1, role: 'admin' } });
    const mockData = { labels: ['May'], datasets: [] };
    (MetricService.getCpuMonthly as any).mockResolvedValue(mockData);

    const req = {
      url: 'http://localhost?hostgroup=HG1&hostnameId=1&month=May&year=2026',
      nextUrl: { pathname: '/api/metrics/cpu-monthly' }
    };
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockData);
  });
});
