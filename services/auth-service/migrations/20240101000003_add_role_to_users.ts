// ============================================
// Migration: Add role to users table
// ============================================

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('auth').alterTable('users', (table) => {
    table.enum('role', ['user', 'admin']).notNullable().defaultTo('user');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('auth').alterTable('users', (table) => {
    table.dropColumn('role');
  });
}
