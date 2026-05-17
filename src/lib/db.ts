
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mperf-db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sarlog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
