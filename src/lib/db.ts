
import mysql from 'mysql2/promise';

/**
 * Decodes a password if it is Base64 encoded (prefixed with 'base64:').
 * Otherwise returns the original string.
 */
export function decodePassword(password: string): string {
  if (password.startsWith('base64:')) {
    const encoded = password.substring(7);
    try {
      return Buffer.from(encoded, 'base64').toString('utf8');
    } catch (error) {
      console.error('Failed to decode Base64 password:', error);
      return password;
    }
  }
  return password;
}

const rawPassword = process.env.DB_PASSWORD || 'password';
const decodedPassword = decodePassword(rawPassword);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mperf-db',
  user: process.env.DB_USER || 'root',
  password: decodedPassword,
  database: process.env.DB_NAME || 'sarlog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
