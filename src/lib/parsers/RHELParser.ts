
import { ISarParser, SarMetric } from './types';

export class RHELParser implements ISarParser {
  canHandle(header: string): boolean {
    return header.includes('Linux') && (header.includes('Red Hat') || header.includes('CentOS'));
  }

  parse(rawContent: string, hostnameId: number, type: 'cpu' | 'mem'): SarMetric[] {
    const lines = rawContent.split('\n');
    const metrics: SarMetric[] = [];
    let currentDateStr = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (i <= 1 && line.includes('/')) {
        const parts = line.split(/\s+/);
        for (const part of parts) {
          if (part.includes('/')) {
            currentDateStr = part;
            break;
          }
        }
      }

      if (i < 2) continue;

      const cols = line.split(/\s+/);
      if (cols.length < 2) continue;

      const timeStr = cols[0];
      if (timeStr === 'Average:') break;

      const timestamp = new Date(`${currentDateStr} ${timeStr}`);
      if (isNaN(timestamp.getTime())) continue;

      if (type === 'cpu') {
        if (cols.length >= 8) {
          const offset = isNaN(Number(cols[1])) ? 2 : 1;
          metrics.push({
            timestamp,
            hostnameId,
            usr: parseFloat(cols[offset + 1]),
            nice: parseFloat(cols[offset + 2]),
            sys: parseFloat(cols[offset + 3]),
            wio: parseFloat(cols[offset + 4]),
            steal: parseFloat(cols[offset + 5]),
            idle: parseFloat(cols[offset + 6]),
          });
        }
      } else {
        if (cols.length >= 3) {
          metrics.push({
            timestamp,
            hostnameId,
            memUsed: parseFloat(cols[2]) / 1024 / 1024,
            memFree: parseFloat(cols[1]) / 1024 / 1024,
          });
        }
      }
    }
    return metrics;
  }
}
