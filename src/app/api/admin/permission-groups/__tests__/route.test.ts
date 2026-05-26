import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import pool from '@/lib/db';

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

// Mock authOptions
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Admin Permission Groups API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    test('returns all permission groups and mappings for admin', async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: 1, role: 'admin' } });
      const mockPGs = [{ pg_id: 1, pg_name: 'AccessA' }];
      const mockPGH = [{ pg_id: 1, hostgroup_id: 101 }];
      
      (pool.query as any)
        .mockResolvedValueOnce([mockPGs])
        .mockResolvedValueOnce([mockPGH]);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.pgs).toEqual(mockPGs);
      expect(data.pgh).toEqual(mockPGH);
    });
  });

  describe('POST', () => {
    test('creates new permission group with hostgroups', async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: 1, role: 'admin' } });
      
      const mockConn = {
        beginTransaction: vi.fn(),
        query: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
      };
      (pool.getConnection as any).mockResolvedValue(mockConn);
      (pool.query as any).mockResolvedValueOnce([[]]); // Name check
      (mockConn.query as any).mockResolvedValueOnce([{ insertId: 20 }]); // Insert PG
      
      const payload = { pg_name: 'NewPG', hostgroup_ids: [1, 2] };
      const req = new Request('http://localhost/api/admin/permission-groups', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockConn.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO permission_groups'), expect.anything());
      expect(mockConn.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO pg_hostgroups'), expect.anything());
    });
  });
});
