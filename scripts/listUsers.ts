import pool from '../src/lib/db';

async function listUsers() {
  try {
    const [rows] = await pool.query('SELECT user_id, username, permission FROM user');
    console.log(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    process.exit();
  }
}

listUsers();
