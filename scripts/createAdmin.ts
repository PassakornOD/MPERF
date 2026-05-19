import pool from '../src/lib/db';
import crypto from 'crypto';

async function createDefaultAdmin() {
  const username = 'mfadmin';
  const password = 'P@ssw0rd';
  const role = 'admin';
  
  // SHA1 hash for legacy compatibility
  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

  try {
    const [existing]: any = await (pool as any).query('SELECT * FROM user WHERE username = ?', [username]);
    
    if (existing.length === 0) {
      await (pool as any).query(
        'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role]
      );
      console.log(`Default admin user '${username}' created successfully.`);
    } else {
      console.log(`Admin user '${username}' already exists.`);
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  } finally {
    process.exit();
  }
}

createDefaultAdmin();
