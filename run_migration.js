import { Client } from 'pg';

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://aicr_user:aicr_password_change_me@localhost:5432/aicr_db'
  });
  
  await client.connect();
  
  try {
    await client.query(`ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}' NOT NULL;`);
    console.log('Settings column added successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
