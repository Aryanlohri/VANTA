import knex, { Knex } from 'knex';
import config from './knexfile';
import { createLogger } from '@aicr/shared';

const logger = createLogger('review-service:db');
let db: Knex;

export async function initDatabase(): Promise<Knex> {
  db = knex(config);
  await db.raw('SELECT 1');
  logger.info('Database connected');
  await db.raw('CREATE SCHEMA IF NOT EXISTS reviews');
  const [batch, migrations] = await db.migrate.latest();
  if (migrations.length > 0) logger.info({ batch, migrations }, 'Ran migrations');
  return db;
}

export function getDb(): Knex {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) { await db.destroy(); logger.info('Database closed'); }
}
