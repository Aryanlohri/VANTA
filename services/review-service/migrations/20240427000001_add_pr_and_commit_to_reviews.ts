import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasPullRequestNumber = await knex.schema.withSchema('reviews').hasColumn('reviews', 'pull_request_number');
  const hasCommitSha = await knex.schema.withSchema('reviews').hasColumn('reviews', 'commit_sha');

  await knex.schema.withSchema('reviews').alterTable('reviews', (table) => {
    if (!hasPullRequestNumber) {
      table.integer('pull_request_number').nullable();
    }
    if (!hasCommitSha) {
      table.string('commit_sha').nullable();
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('reviews').alterTable('reviews', (table) => {
    table.dropColumn('pull_request_number');
    table.dropColumn('commit_sha');
  });
}
