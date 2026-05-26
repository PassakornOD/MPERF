import { expect, test, describe, vi, beforeEach } from 'vitest';
import { MetricService } from '../MetricService';
import pool from '@/lib/db';

// Mock the database pool
vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn(),
    getConnection: vi.fn(),
  },
}));

describe('MetricService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('getOsType returns OS from database', async () => {
    (pool.query as any).mockResolvedValue([[{ OS: 'Solaris' }]]);
    const os = await MetricService.getOsType(1);
    expect(os).toBe('Solaris');
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT OS'), [1]);
  });

  test('getOsType returns Unknown if not found', async () => {
    (pool.query as any).mockResolvedValue([[]]);
    const os = await MetricService.getOsType(999);
    expect(os).toBe('Unknown');
  });

  test('canAccessHostgroup returns true for admin', async () => {
    const result = await MetricService.canAccessHostgroup(1, 'admin', 'Datawarehouse');
    expect(result).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('canAccessHostgroup returns true if user has permission', async () => {
    (pool.query as any).mockResolvedValue([[{ 1: 1 }]]);
    const result = await MetricService.canAccessHostgroup(1, 'sysadmin', 'Datawarehouse');
    expect(result).toBe(true);
    expect(pool.query).toHaveBeenCalled();
  });

  test('getHostGroups orchestrates data correctly', async () => {
    const mockRows = [
      { hostgroup_id: 1, hostgroup: 'HG1', hostname_id: 10, hostname: 'HN1', mem: 16, Pagesize: 4096 },
      { hostgroup_id: 1, hostgroup: 'HG1', hostname_id: 11, hostname: 'HN2', mem: 32, Pagesize: 4096 },
      { hostgroup_id: 2, hostgroup: 'HG2', hostname_id: 20, hostname: 'HN3', mem: 64, Pagesize: 8192 },
    ];
    (pool.query as any).mockResolvedValue([mockRows]);

    const groups = await MetricService.getHostGroups(1, 'admin');
    expect(groups).toHaveLength(2);
    expect(groups[0].hostgroup).toBe('HG1');
    expect(groups[0].hostnames).toHaveLength(2);
    expect(groups[1].hostnames).toHaveLength(1);
  });
});
