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

describe('Admin User Groups API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    test('returns groups list excluding personal groups', async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: '1', role: 'admin' } });
      const mockGroups = [{ ug_id: 1, ug_name: 'GroupA' }];
      (pool.query as any).mockResolvedValue([mockGroups]);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockGroups);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT ug.*'), expect.anything());
    });
  });

  describe('POST', () => {
    test('creates new user group and adds creator', async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: 1, role: 'admin' } });
      
      const mockConn = {
        beginTransaction: vi.fn(),
        query: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
      };
      (pool.getConnection as any).mockResolvedValue(mockConn);
      (pool.query as any)
        .mockResolvedValueOnce([[]]) // Username check
        .mockResolvedValueOnce([[]]); // Existing group check
      
      (mockConn.query as any).mockResolvedValueOnce([{ insertId: 10 }]); // Insert group
      
      const req = new Request('http://localhost/api/admin/user-groups', {
        method: 'POST',
        body: JSON.stringify({ ug_name: 'SecurityTeam' })
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockConn.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO user_groups'), expect.anything());
      expect(mockConn.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO user_to_user_groups'), expect.anything());
    });
  });
});
