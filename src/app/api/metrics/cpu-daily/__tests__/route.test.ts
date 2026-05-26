import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { MetricService } from '@/lib/services/MetricService';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock MetricService
vi.mock('@/lib/services/MetricService', () => ({
  MetricService: {
    getCpuDaily: vi.fn(),
  },
}));

// Mock authOptions
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('CPU Daily API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 if user is not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new Request('http://localhost/api/metrics/cpu-daily?hostgroup=HG1&hostnameId=1&startDate=2026-05-19&endDate=2026-05-20');
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  test('returns 400 if parameters are missing', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: '1', role: 'admin' } });
    const req = new Request('http://localhost/api/metrics/cpu-daily?hostgroup=HG1'); // Missing hostnameId, etc.
    const res = await GET(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing parameters');
  });

  test('returns metrics on success', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: '1', role: 'admin' } });
    const mockData = [{ time: '2026-05-19 12:00:00', usr: 10 }];
    (MetricService.getCpuDaily as any).mockResolvedValue(mockData);

    const url = 'http://localhost/api/metrics/cpu-daily?hostgroup=HG1&hostnameId=1&startDate=2026-05-19&endDate=2026-05-20&type=Normal';
    const req = new Request(url);
    const res = await GET(req as any);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockData);
    expect(MetricService.getCpuDaily).toHaveBeenCalledWith(1, 'admin', 'HG1', 1, 'Normal', '2026-05-19', '2026-05-20');
  });
});
