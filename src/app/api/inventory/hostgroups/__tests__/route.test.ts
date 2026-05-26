import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import pool from '@/lib/db';
import { checkPermission } from '@/lib/permissions';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
}));

vi.mock('@/lib/permissions', () => ({
  checkPermission: vi.fn(),
}));

// Mock authOptions
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Inventory Hostgroups API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    test('returns 401 if user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    test('returns hostgroups with hostnames for admin', async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: '1', role: 'admin' } });
      
      const mockGroups = [{ hostgroup_id: 1, hostgroup: 'HG1' }];
      const mockHostnames = [{ hostname_id: 101, hostname: 'HN1', hostgroup_id: 1 }];
      
      (pool.query as any)
        .mockResolvedValueOnce([mockGroups]) // First query for groups
        .mockResolvedValueOnce([mockHostnames]); // Second query for hostnames

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data).toHaveLength(1);
      expect(data[0].hostnames).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM hostgroup'), []);
    });
  });

  describe('POST', () => {
    test('returns 403 if user lacks permission', async () => {
      (getServerSession as any).mockResolvedValue({ user: { role: 'operation' } });
      (checkPermission as any).mockReturnValue(false);
      
      const req = new Request('http://localhost/api/inventory/hostgroups', { method: 'POST' });
      const res = await POST(req as any);
      expect(res.status).toBe(403);
    });

    test('creates hostgroup if user is admin', async () => {
      (getServerSession as any).mockResolvedValue({ user: { role: 'admin', name: 'admin_user' } });
      (checkPermission as any).mockReturnValue(true);
      
      const mockConn = {
        beginTransaction: vi.fn(),
        query: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
      };
      (pool.getConnection as any).mockResolvedValue(mockConn);
      (mockConn.query as any)
        .mockResolvedValueOnce([[]]) // Check for duplicate
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert hostgroup
      
      const req = new Request('http://localhost/api/inventory/hostgroups', { 
        method: 'POST',
        body: JSON.stringify({ hostgroup: 'NewHG', pg_id: 10 })
      });
      
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockConn.commit).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
    });
  });
});
