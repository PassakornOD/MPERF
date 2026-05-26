import { expect, test, describe, vi, beforeEach } from 'vitest';
import { getAllowedHostgroups } from '../rbac';
import pool from '@/lib/db';

vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn(),
  },
}));

describe('RBAC Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('getAllowedHostgroups returns empty for admin (bypassed)', async () => {
    const result = await getAllowedHostgroups('admin');
    expect(result).toEqual([]);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('getAllowedHostgroups returns mapped IDs for other roles', async () => {
    (pool.query as any).mockResolvedValue([[{ hostgroup_id: 1 }, { hostgroup_id: 2 }]]);
    const result = await getAllowedHostgroups('sysadmin');
    expect(result).toEqual([1, 2]);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT rh.hostgroup_id'), ['sysadmin']);
  });
});
