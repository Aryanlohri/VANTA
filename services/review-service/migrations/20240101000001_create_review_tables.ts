import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Reviews table
  await knex.schema.withSchema('reviews').createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('repo_id').notNullable();
    table.uuid('user_id').notNullable();
    table.string('title', 500).notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.integer('overall_score').nullable();
    table.text('summary').nullable();
    table.specificType('positives', 'text[]').defaultTo('{}');
    table.specificType('overall_suggestions', 'text[]').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('user_id');
    table.index('repo_id');
    table.index('status');
  });

  // Review files
  await knex.schema.withSchema('reviews').createTable('review_files', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('review_id').notNullable().references('id').inTable('reviews.reviews').onDelete('CASCADE');
    table.string('file_path', 1000).notNullable();
    table.text('content').notNullable();
    table.string('language', 100).nullable();
    table.index('review_id');
  });

  // Review comments (AI-generated)
  await knex.schema.withSchema('reviews').createTable('review_comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('review_file_id').notNullable().references('id').inTable('reviews.review_files').onDelete('CASCADE');
    table.integer('line_number').notNullable();
    table.enum('type', ['bug', 'security', 'performance', 'style', 'best_practice']).notNullable();
    table.enum('severity', ['critical', 'major', 'minor', 'info']).notNullable();
    table.text('message').notNullable();
    table.text('suggestion').nullable();
    table.text('improved_code').nullable();
    table.index('review_file_id');
    table.index('type');
    table.index('severity');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('reviews').dropTableIfExists('review_comments');
  await knex.schema.withSchema('reviews').dropTableIfExists('review_files');
  await knex.schema.withSchema('reviews').dropTableIfExists('reviews');
}
