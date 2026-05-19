import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'security.log');

export const logSecurityEvent = (message: string, context?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${context ? JSON.stringify(context) : ''}\n`;
  
  // ในโปรดักชันจริงแนะนำให้ใช้บริการอย่าง Winston หรือไฟล์ Log บน Cloud
  fs.appendFileSync(logFilePath, logEntry);
  console.log(logEntry);
};
