// ============================================
// Migration: Create repositories table
// ============================================

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('repositories').createTable('repositories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.bigInteger('github_repo_id').notNullable();
    table.string('name', 255).notNullable();
    table.string('full_name', 512).notNullable();
    table.text('description').nullable();
    table.string('language', 100).nullable();
    table.string('default_branch', 100).defaultTo('main');
    table.boolean('is_private').defaultTo(false);
    table.boolean('is_connected').defaultTo(true);
    table.bigInteger('webhook_id').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    // Composite unique constraint
    table.unique(['user_id', 'github_repo_id']);

    // Indexes
    table.index('user_id');
    table.index('github_repo_id');
    table.index('is_connected');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('repositories').dropTableIfExists('repositories');
}
