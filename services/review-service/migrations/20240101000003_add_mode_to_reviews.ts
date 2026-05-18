import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('reviews').alterTable('reviews', (table) => {
    table.enum('mode', ['standard', 'security', 'performance', 'style']).notNullable().defaultTo('standard');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('reviews').alterTable('reviews', (table) => {
    table.dropColumn('mode');
  });
}
