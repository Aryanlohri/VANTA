import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.withSchema('auth').hasColumn('users', 'settings');
  if (!hasColumn) {
    await knex.schema.withSchema('auth').alterTable('users', (table) => {
      table.jsonb('settings').defaultTo('{}').notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.withSchema('auth').hasColumn('users', 'settings');
  if (hasColumn) {
    await knex.schema.withSchema('auth').alterTable('users', (table) => {
      table.dropColumn('settings');
    });
  }
}
