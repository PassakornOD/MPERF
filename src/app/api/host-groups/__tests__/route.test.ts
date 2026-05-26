import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import pool from '@/lib/db';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/db', () => ({
  default: { query: vi.fn() }
}));
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }));

describe('Host Groups API', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns hostgroups list for authenticated user', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 1, role: 'admin' } });
    
    const mockData = [{ hostgroup_id: 1, hostgroup: 'HG1', hostnames: [] }];
    (pool.query as any).mockResolvedValue([[{ hostgroup_id: 1, hostgroup: 'HG1' }]]); // Simulate DB row
    
    // Assume route.ts handles the mapping logic where hostnames array is added
    // If the mock query doesn't match the final structure, adjust expectation
    (pool.query as any).mockResolvedValueOnce([[{ hostgroup_id: 1, hostgroup: 'HG1' }]])
                       .mockResolvedValueOnce([[]]); // No hostnames for this group

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockData);
  });

  test('returns 401 if not logged in', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
