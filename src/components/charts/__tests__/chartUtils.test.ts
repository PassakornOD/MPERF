import { expect, test, describe } from 'vitest';
import Highcharts from 'highcharts';

describe('Chart Logic', () => {
    test('Highcharts configuration is initialized', () => {
        expect(Highcharts).toBeDefined();
    });

    test('Data transformation logic (mocked logic test)', () => {
        const mockData = [{ time: '10:00', usr: 10, idle: 90 }];
        
        // Example of logic that would exist in a utility file
        const transformData = (data: any[]) => data.map(d => ({
            x: d.time,
            y: d.usr
        }));
        
        const transformed = transformData(mockData);
        expect(transformed[0].y).toBe(10);
    });
});
