// ============================================
// Migration: Create users table
// ============================================

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Ensure uuid extension is available
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.withSchema('auth').createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.bigInteger('github_id').unique().notNullable();
    table.string('username', 100).unique().notNullable();
    table.string('email', 255).nullable();
    table.text('avatar_url').nullable();
    table.text('access_token_encrypted').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    // Indexes
    table.index('github_id');
    table.index('username');
    table.index('email');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('auth').dropTableIfExists('users');
}
