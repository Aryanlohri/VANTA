// ============================================
// Auth Service — Database Configuration
// ============================================

import type { Knex } from 'knex';
import dotenv from 'dotenv';

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
  searchPath: ['auth', 'public'],
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 10000,
  },
  migrations: {
    directory: '../migrations',
    tableName: 'auth_migrations',
    schemaName: 'auth',
  },
};

export default config;
