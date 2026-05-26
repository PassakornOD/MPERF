import { SarIngestionService, IngestOptions } from '../src/lib/services/SarIngestionService';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    const args = process.argv.slice(2);
    const options: IngestOptions = {};

    args.forEach(arg => {
        const [key, value] = arg.split('=');
        if (key === '--hostgroup') options.hostgroup = value;
        if (key === '--hostname') options.hostname = value;
        if (key === '--month') options.month = value;
        if (key === '--day') options.day = value;
        if (key === '--os') options.os = value as any;
    });

    console.log('Starting ingestion with options:', options);
    
    try {
        const results = await SarIngestionService.ingest(options, { email: 'system' });
        results.forEach(res => console.log(res));
        console.log('Ingestion completed.');
    } catch (error) {
        console.error('Ingestion failed:', error);
        process.exit(1);
    }
}

run();
