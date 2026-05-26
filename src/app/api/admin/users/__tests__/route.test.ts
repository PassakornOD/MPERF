import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import pool from '@/lib/db';
import { logSecurityEvent } from '@/lib/logger';

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

vi.mock('@/lib/logger', () => ({
  logSecurityEvent: vi.fn(),
}));

// Mock authOptions
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Admin Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    test('returns users list for admin', async () => {
      (getServerSession as any).mockResolvedValue({ user: { role: 'admin', username: 'admin' } });
      const mockUsers = [{ user_id: 1, username: 'user1', role: 'viewer' }];
      (pool.query as any).mockResolvedValue([mockUsers]);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockUsers);
    });

    test('returns 401 if unauthorized role', async () => {
      (getServerSession as any).mockResolvedValue({ user: { role: 'viewer' } });
      const res = await GET();
      expect(res.status).toBe(401);
    });
  });

  describe('POST', () => {
    test('creates new user with personal group', async () => {
      (getServerSession as any).mockResolvedValue({ user: { role: 'admin', name: 'admin' } });
      
      const mockConn = {
        beginTransaction: vi.fn(),
        query: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
      };
      (pool.getConnection as any).mockResolvedValue(mockConn);
      (pool.query as any)
        .mockResolvedValueOnce([[], []]) // Roles check
        .mockResolvedValueOnce([[], []]); // Existing user check
      
      (mockConn.query as any)
        .mockResolvedValueOnce([{ insertId: 1 }, []]) // Insert user
        .mockResolvedValueOnce([{ insertId: 2 }, []]) // Insert group
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // Insert mapping
      
      const payload = { username: 'newuser', password: 'password123', role: 'operation' };
      const req = new Request('http://localhost/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockConn.beginTransaction).toHaveBeenCalled();
      expect(mockConn.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO user'), expect.anything());
      expect(mockConn.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO user_groups'), expect.anything());
      expect(mockConn.commit).toHaveBeenCalled();
    });
  });
});
