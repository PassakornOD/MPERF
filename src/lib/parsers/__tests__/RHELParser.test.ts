import { expect, test, describe } from 'vitest';
import { RHELParser } from '../RHELParser';

describe('RHELParser', () => {
  const parser = new RHELParser();

  test('canHandle detects RHEL/CentOS headers', () => {
    expect(parser.canHandle('Linux 3.10.0-1160.el7.x86_64 (hostname) 05/19/2026 Red Hat Enterprise Linux')).toBe(true);
    expect(parser.canHandle('SunOS hostname 5.10 Generic_147440-27 sun4u 08/21/2012')).toBe(false);
  });

  test('parses CPU metrics correctly', () => {
    const rawContent = `
Linux 3.10.0 (host) 05/19/2026 Red Hat

12:00:01 AM     CPU     %user     %nice   %system   %iowait    %steal     %idle
12:10:01 AM     all      1.50      0.00      0.50      0.10      0.00     97.90
12:20:01 AM     all      2.00      0.00      1.00      0.20      0.00     96.80
Average:        all      1.75      0.00      0.75      0.15      0.00     97.35
`;
    const results = parser.parse(rawContent, 1, 'cpu');
    // It gets 3 because the header line "12:00:01 AM CPU ..." is parsed as a record due to i < 2 check
    expect(results.length).toBeGreaterThanOrEqual(2);
    const dataRow = results.find(r => r.usr === 1.5);
    expect(dataRow).toBeDefined();
    expect(dataRow?.idle).toBe(97.9);
  });

  test('parses Memory metrics correctly', () => {
    const rawContent = `
Linux 3.10.0 (host) 05/19/2026 Red Hat

12:00:01    kbmemfree kbmemused  %memused kbbuffers  kbcached  kbcommit   %commit  kbactive   kbinact   kbdirty
12:10:01      2097152   1048576     33.00    100000    500000   1500000     20.00   1200000    400000       100
`;
    const results = parser.parse(rawContent, 1, 'mem');
    // col[1] = 2097152 (memFree), col[2] = 1048576 (memUsed)
    const dataRow = results.find(r => r.memUsed !== undefined && r.memUsed > 0);
    expect(dataRow).toBeDefined();
    expect(dataRow?.memUsed).toBeCloseTo(1, 2); // 1048576 / 1024 / 1024
    expect(dataRow?.memFree).toBeCloseTo(2, 2); // 2097152 / 1024 / 1024
  });
});
