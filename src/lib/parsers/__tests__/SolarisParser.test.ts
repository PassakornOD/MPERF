import { expect, test, describe } from 'vitest';
import { SolarisParser } from '../SolarisParser';

describe('SolarisParser', () => {
  const parser = new SolarisParser();

  test('canHandle detects Solaris headers', () => {
    expect(parser.canHandle('SunOS hostname 5.10 Generic_147440-27 sun4u 08/21/2012')).toBe(true);
    expect(parser.canHandle('Linux 3.10.0-1160.el7.x86_64')).toBe(false);
  });

  test('parses CPU metrics correctly', () => {
    const rawContent = `SunOS host 5.10 Generic_147440-27 sun4u 08/21/2012
Dummy Header Line 1
Dummy Header Line 2
Dummy Header Line 3
00:10:01       5       2       1      92
00:20:01      10       5       2      83`;
    const results = parser.parse(rawContent, 1, 'cpu');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].usr).toBe(5);
    expect(results[0].sys).toBe(2);
    expect(results[0].idle).toBe(92);
  });

  test('parses Memory metrics correctly', () => {
    const rawContent = `SunOS host 5.10 Generic_147440-27 sun4u 08/21/2012
Dummy Header Line 1
Dummy Header Line 2
Dummy Header Line 3
00:10:01  500000  1000000`;
    const results = parser.parse(rawContent, 1, 'mem');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].memFree).toBe(500000);
  });
});
