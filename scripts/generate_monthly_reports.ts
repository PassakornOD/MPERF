import { AutomationService } from '../src/lib/services/AutomationService';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    const args: string[] = process.argv.slice(2);
    let month: number = 0;
    let year: number = 0;

    args.forEach((arg: string) => {
        const [key, value] = arg.split('=');
        if (key === '--month') month = parseInt(value, 10);
        if (key === '--year') year = parseInt(value, 10);
    });

    // If month/year not provided, default to previous month
    if (!month || !year) {
        const d: Date = new Date();
        d.setMonth(d.getMonth() - 1);
        month = month || (d.getMonth() + 1);
        year = year || d.getFullYear();
    }

    console.log(`[CLI] Starting monthly report generation for: ${month}/${year}`);
    
    try {
        const startTime: number = Date.now();
        const finalPath: string = await AutomationService.generateFullMonthlyReport(month, year);
        const duration: string = (((Date.now() - startTime) / 1000) / 60).toFixed(2);
        
        console.log('--------------------------------------------------');
        console.log(`SUCCESS: Full report generated in ${duration} minutes.`);
        console.log(`Path: ${finalPath}`);
        console.log('--------------------------------------------------');
        process.exit(0);
    } catch (error: any) {
        console.error('FAILED: Report generation failed:', error);
        process.exit(1);
    }
}

run();
