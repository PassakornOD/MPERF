import pool from '../src/lib/db';

async function setupDefaultGroups() {
  const defaultGroups = ['admin', 'sysadmin', 'operation'];

  try {
    console.log('--- Starting Default Groups Setup ---');

    for (const groupName of defaultGroups) {
      // 1. Check and Create Group
      const [existingGroup]: any = await (pool as any).query(
        'SELECT ug_id FROM user_groups WHERE LOWER(ug_name) = ?', 
        [groupName.toLowerCase()]
      );

      let groupId;
      if (existingGroup.length === 0) {
        const [res]: any = await (pool as any).query(
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
      // Logic: Only add users who have the role and are NOT already members of this specific group
      const [usersToMap]: any = await (pool as any).query(
        `SELECT user_id FROM user 
         WHERE role = ? 
         AND user_id NOT IN (SELECT user_id FROM user_to_user_groups WHERE ug_id = ?)`,
        [groupName, groupId]
      );

      if (usersToMap.length > 0) {
        const values = usersToMap.map((u: any) => [u.user_id, groupId]);
        await (pool as any).query(
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
