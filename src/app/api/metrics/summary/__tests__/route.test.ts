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
    getCpuStatsSummary: vi.fn(),
    getMemStatsSummary: vi.fn()
  } 
}));
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }));

describe('Summary Metrics API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('returns data on success', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 1, role: 'admin' } });
    const mockCpu = { avg: 10 };
    const mockMem = { avg: 20 };
    (MetricService.getCpuStatsSummary as any).mockResolvedValue(mockCpu);
    (MetricService.getMemStatsSummary as any).mockResolvedValue(mockMem);

    const res = await GET(new Request('http://localhost?hostgroup=HG1&hostnameId=1&month=May&year=2026') as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cpuStats).toEqual(mockCpu);
    expect(data.memStats).toEqual(mockMem);
  });
});
