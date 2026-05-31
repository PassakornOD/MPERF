import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
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

async function setupDefaultGroups() {
  const defaultGroups = ['admin', 'sysadmin', 'operation'];

  try {
    console.log('--- Starting Default Groups Setup ---');

    for (const groupName of defaultGroups) {
      // 1. Check and Create Group
      const [existingGroup] = await pool.query(
        'SELECT ug_id FROM user_groups WHERE LOWER(ug_name) = ?', 
        [groupName.toLowerCase()]
      );

      let groupId;
      if (existingGroup.length === 0) {
        const [res] = await pool.query(
          'INSERT INTO user_groups (ug_name) VALUES (?)', 
          [groupName]
        );
        groupId = res.insertId;
        console.log(`Created group: ${groupName} (ID: ${groupId})`);
      } else {
        groupId = existingGroup[0].ug_id;
        console.log(`Group already exists: ${groupName} (ID: ${groupId})`);
      }

      // 2. Map users with matching role to this group
      const [usersToMap] = await pool.query(
        `SELECT user_id FROM user 
         WHERE role = ? 
         AND user_id NOT IN (SELECT user_id FROM user_to_user_groups WHERE ug_id = ?)`,
        [groupName, groupId]
      );

      if (usersToMap.length > 0) {
        const values = usersToMap.map(u => [u.user_id, groupId]);
        await pool.query(
          'INSERT INTO user_to_user_groups (user_id, ug_id) VALUES ?',
          [values]
        );
        console.log(`Added ${usersToMap.length} users to group '${groupName}'`);
      } else {
        console.log(`No new users to add to group '${groupName}'`);
      }
    }

    console.log('--- Setup Completed Successfully ---');
  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    process.exit();
  }
}

setupDefaultGroups();
