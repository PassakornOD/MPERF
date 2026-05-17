
import { ISarParser, SarMetric } from './types';

export class SolarisParser implements ISarParser {
  canHandle(header: string): boolean {
    return header.includes('SunOS');
  }

  parse(rawContent: string, hostnameId: number, type: 'cpu' | 'mem'): SarMetric[] {
    const lines = rawContent.split('\n');
    const metrics: SarMetric[] = [];
    let currentDateStr = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (i === 0) {
        // Solaris header: SunOS hostname 5.10 Generic_147440-27 sun4u 08/21/2012
        const parts = line.split(/\s+/);
        currentDateStr = parts[parts.length - 1];
      }

      if (i < 4) continue; // Skip headers

      const cols = line.split(/\s+/);
      if (cols.length < 2) continue;

      const timeStr = cols[0];
      const timestamp = new Date(`${currentDateStr} ${timeStr}`);
      if (isNaN(timestamp.getTime())) continue;

      if (type === 'cpu') {
        // Solaris CPU: time %usr %sys %wio %idle
        metrics.push({
          timestamp,
          hostnameId,
          usr: parseFloat(cols[1]),
          sys: parseFloat(cols[2]),
          wio: parseFloat(cols[3]),
          idle: parseFloat(cols[4]),
        });
      } else {
        // Solaris Mem: time freemem freeswap
        // Logic from sta-load-r.php: $memData = $mem_factor - ($memData * $pagesize / 1024 / 1024 / 1024);
        metrics.push({
          timestamp,
          hostnameId,
          memFree: parseFloat(cols[1]), // This usually needs pagesize calculation
        });
      }
    }
    return metrics;
  }
}
