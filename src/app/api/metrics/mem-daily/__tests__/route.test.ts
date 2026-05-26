import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { MetricService } from '@/lib/services/MetricService';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/services/MetricService', () => ({ MetricService: { getMemDaily: vi.fn() } }));
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }));

describe('Memory Daily API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test('returns 401 if not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const res = await GET(new Request('http://localhost') as any);
    expect(res.status).toBe(401);
  });

  test('returns data on success', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 1, role: 'admin' } });
    const mockData = [{ time: '12:00', util: 50 }];
    (MetricService.getMemDaily as any).mockResolvedValue(mockData);

    const res = await GET(new Request('http://localhost?hostgroup=HG1&hostnameId=1&startDate=2026-05-19&endDate=2026-05-20') as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockData);
  });
});
