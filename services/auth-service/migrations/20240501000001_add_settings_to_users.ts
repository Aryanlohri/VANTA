import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('auth').alterTable('users', (table) => {
    table.jsonb('settings').defaultTo('{}').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('auth').alterTable('users', (table) => {
    table.dropColumn('settings');
  });
}
