import { expect, test, describe, vi, beforeEach } from 'vitest';
import { SarIngestionService, IngestOptions } from '../SarIngestionService';
import pool from '@/lib/db';
import fs from 'fs';

// Mock DB
vi.mock('@/lib/db', () => ({
  default: {
    query: vi.fn(),
  },
}));

// Mock FS
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
    existsSync: vi.fn(),
    statSync: vi.fn(),
  },
}));

describe('SarIngestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default existsSync to true for base paths
    (fs.existsSync as any).mockReturnValue(true);
    (fs.statSync as any).mockReturnValue({ isDirectory: () => true });
  });

  test('ingest orchestrates scanning and processing', async () => {
    const options: IngestOptions = {
      os: 'RedHat',
      dataType: 'cpu',
      day: '2026-05-19'
    };
    
    // Mock hostgroup/hostname structure
    (fs.readdirSync as any).mockImplementation((path: string) => {
        if (path.endsWith('data_RedHat')) return ['HG_A'];
        if (path.endsWith('HG_A')) return ['HN_1'];
        if (path.endsWith('sar-u')) return ['19May.sar-u'];
        return [];
    });

    (fs.readFileSync as any).mockReturnValue('Linux 3.10.0 (host) 05/19/2026 Red Hat\n12:00:01 AM all 1 0 1 0 0 98');
    (pool.query as any).mockResolvedValue([[{ hostname_id: 101, mem: 16, Pagesize: 4096 }]]); // Hostname lookup

    const results = await SarIngestionService.ingest(options, { email: 'test@mfec.co.th' });
    
    expect(results).toHaveLength(1);
    expect(results[0]).toContain('[Success]');
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT IGNORE'), expect.anything());
  });

  test('ingest handles empty directories gracefully', async () => {
    (fs.readdirSync as any).mockReturnValue([]);
    const results = await SarIngestionService.ingest({ dataType: 'All' }, {});
    expect(results).toHaveLength(0);
  });
});
