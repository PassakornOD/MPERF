import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import pool from '@/lib/db';
import { checkPermission } from '@/lib/permissions';
import fs from 'fs';

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

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
  },
}));

// Mock authOptions
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Inventory Hostnames API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    test('returns hostnames filtered by hostgroup_id', async () => {
      (getServerSession as any).mockResolvedValue({ user: { id: '1', role: 'admin' } });
      const mockHosts = [{ hostname_id: 1, hostname: 'Host1' }];
      (pool.query as any).mockResolvedValue([mockHosts]);

      const req = new Request('http://localhost/api/inventory/hostnames?hostgroup_id=10');
      const res = await GET(req as any);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('h.hostgroup_id = ?'), expect.arrayContaining([10]));
    });
  });

  describe('POST', () => {
    test('creates hostname and related tables', async () => {
      (getServerSession as any).mockResolvedValue({ user: { role: 'admin', name: 'admin' } });
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
        .mockResolvedValueOnce([[]]) // Check duplicate
        .mockResolvedValueOnce([{ insertId: 501 }]); // Insert hostname
      
      (fs.existsSync as any).mockReturnValue(true);
      (pool.query as any).mockResolvedValue([[{ hostgroup: 'GroupA' }]]); // HG name lookup

      const payload = {
        hostname: 'NewServer',
        hostgroup_id: 1,
        OS: 'Red Hat',
        mem: 16,
        Pagesize: 4096
      };
      
      const req = new Request('http://localhost/api/inventory/hostnames', { 
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockConn.commit).toHaveBeenCalled();
      expect(mockConn.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE `NewServer:u`'));
      expect(mockConn.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE `NewServer:r`'));
    });
  });
});
