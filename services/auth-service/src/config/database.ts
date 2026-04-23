// ============================================
// Auth Service — Database Connection
// ============================================

import knex, { Knex } from 'knex';
import config from './knexfile';
import { createLogger } from '@aicr/shared';

const logger = createLogger('auth-service:db');
let db: Knex;

/**
 * Initialize the database connection and run migrations.
 */
export async function initDatabase(): Promise<Knex> {
  try {
    db = knex(config);

    // Test the connection
    await db.raw('SELECT 1');
    logger.info('Database connection established');

    // Ensure the auth schema exists
    await db.raw('CREATE SCHEMA IF NOT EXISTS auth');

    // Run pending migrations
    const [batch, migrations] = await db.migrate.latest();
    if (migrations.length > 0) {
      logger.info({ batch, migrations }, 'Ran database migrations');
    } else {
      logger.info('Database migrations are up to date');
    }

    return db;
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to database');
    throw error;
  }
}

/**
 * Get the database instance.
 */
export function getDb(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Gracefully close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
  }
}
