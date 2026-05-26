import { expect, test, describe } from 'vitest';
import { getChartOptions } from '../chartUtils';

describe('Chart Utilities', () => {
    test('getChartOptions generates correct CPU Daily configuration', () => {
        const metrics = [{ time: '2026-05-26 10:00:00', idle: 80, usr: 15, sys: 5 }];
        const report = { type: 'cpu-daily', mode: 'Normal' };
        
        const options = getChartOptions(metrics, report, 'TestHost', 16, '2026-05-26', '2026-05-26', '05', '2026');
        
        expect(options.series).toBeDefined();
        // Check for dynamic series based on keys
        expect(options.series.some((s: any) => s.name === '%idle')).toBe(true);
        expect(options.series.some((s: any) => s.name === '%usr')).toBe(true);
        // Check legend styling
        expect(options.legend).toBeDefined();
        expect(options.legend.borderWidth).toBe(1);
    });

    test('getChartOptions generates correct Memory Daily configuration', () => {
        const metrics = [{ time: '2026-05-26 10:00:00', mem: 4 }];
        const report = { type: 'mem-daily', mode: 'Normal' };
        
        const options = getChartOptions(metrics, report, 'TestHost', 16, '2026-05-26', '2026-05-26', '05', '2026', 4);
        
        expect(options.yAxis.labels.formatter).toBeDefined();
        expect(options.yAxis.plotLines).toBeDefined();
        expect(options.series[0].name).toBe('mem usage');
    });
});
