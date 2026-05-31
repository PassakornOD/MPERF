import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'sarlog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function migrate() {
  try {
    console.log('--- Checking permission_groups schema ---');
    
    // Add created_by column to permission_groups if missing
    const [columns] = await pool.query('SHOW COLUMNS FROM permission_groups LIKE "created_by"');
    if (columns.length === 0) {
      await pool.query('ALTER TABLE permission_groups ADD COLUMN created_by INT DEFAULT NULL');
      await pool.query('ALTER TABLE permission_groups ADD CONSTRAINT fk_pg_created_by FOREIGN KEY (created_by) REFERENCES user(user_id) ON DELETE SET NULL');
      console.log('Added created_by column to permission_groups');
    } else {
      console.log('created_by column already exists');
    }

    console.log('--- Migration completed ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
