// ============================================
// Repository Service — Database Configuration
// ============================================

import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../../.env' });

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'aicr_user',
    password: process.env.POSTGRES_PASSWORD || 'aicr_password_change_me',
    database: process.env.POSTGRES_DB || 'aicr_db',
  },
  searchPath: ['repositories', 'public'],
  pool: { min: 2, max: 10 },
  migrations: {
    directory: path.resolve(__dirname, '../../migrations'),
    tableName: 'repo_migrations',
    schemaName: 'repositories',
  },
};

export default config;
