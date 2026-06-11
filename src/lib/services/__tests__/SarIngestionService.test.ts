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

  test('processFile handles RedHat memory files with date columns', async () => {
    const options: IngestOptions = { os: 'RedHat', dataType: 'mem', day: '2026-05-12' };
    (fs.readdirSync as any).mockImplementation((path: string) => {
        if (path.endsWith('data_RedHat')) return ['HG_B'];
        if (path.endsWith('HG_B')) return ['HN_2'];
        if (path.endsWith('sar-r')) return ['12May.mem'];
        return [];
    });
    // File with DATE column: DATE TIME MEMUSAGE(MB)
    (fs.readFileSync as any).mockReturnValue('DATE TIME MEMUSAGE(MB)\n05/12/2026 00:00:02 52695');
    (pool.query as any).mockResolvedValue([[{ hostname_id: 102, mem: 64, Pagesize: 4096 }]]);

    const results = await SarIngestionService.ingest(options, {});
    
    expect(results[0]).toContain('[Success]');
    // Check if memory value 52695/1024 = 51.4599... was parsed correctly
    const lastCall = (pool.query as any).mock.calls.find((call: any) => call[0].includes('INSERT IGNORE INTO `HG_B:r`'));
    const insertedData = lastCall[1][0][0];
    expect(insertedData[0]).toBe('2026-05-12 00:00:02');
    expect(insertedData[1]).toBeCloseTo(51.46, 1);
  });

  test('processFile handles RedHat CPU files with AM/PM', async () => {
    const options: IngestOptions = { os: 'RedHat', dataType: 'cpu', day: '2026-05-13' };
    (fs.readdirSync as any).mockImplementation((path: string) => {
        if (path.endsWith('data_RedHat')) return ['HG_C'];
        if (path.endsWith('HG_C')) return ['HN_3'];
        if (path.endsWith('sar-u')) return ['13May.sar-u'];
        return [];
    });
    // File with AM/PM: 12:10:00 AM all 4.49 0.00 8.07 0.11 0.00 87.34
    (fs.readFileSync as any).mockReturnValue('Linux 4.18\n\n12:10:00 AM all 4.49 0.00 8.07 0.11 0.00 87.34');
    (pool.query as any).mockResolvedValue([[{ hostname_id: 103, mem: 32, Pagesize: 4096 }]]);

    const results = await SarIngestionService.ingest(options, {});
    
    const lastCall = (pool.query as any).mock.calls.find((call: any) => call[0].includes('INSERT IGNORE INTO `HG_C:u`'));
    const insertedData = lastCall[1][0][0];
    expect(insertedData[0]).toBe('2026-05-13 00:10:00'); // 12:10 AM -> 00:10
    expect(insertedData[1]).toBe(4.49);
  });

  test('ingest handles empty directories gracefully', async () => {
    (fs.readdirSync as any).mockReturnValue([]);
    const results = await SarIngestionService.ingest({ dataType: 'All' }, {});
    expect(results).toHaveLength(0);
  });
});
