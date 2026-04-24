// ============================================
// Migration: Create subscriptions table
// ============================================

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.withSchema('auth').createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('auth.users').onDelete('CASCADE');
    table.enum('plan', ['free', 'pro', 'team']).notNullable().defaultTo('free');
    table.enum('status', ['active', 'cancelled', 'expired', 'past_due']).notNullable().defaultTo('active');
    table.enum('billing_cycle', ['monthly', 'annual']).notNullable().defaultTo('monthly');

    // Razorpay identifiers
    table.string('razorpay_subscription_id', 255).nullable();
    table.string('razorpay_payment_id', 255).nullable();
    table.string('razorpay_customer_id', 255).nullable();

    // Plan limits
    table.integer('reviews_limit').notNullable().defaultTo(5);
    table.integer('reviews_used').notNullable().defaultTo(0);

    // Dates
    table.timestamp('current_period_start').nullable();
    table.timestamp('current_period_end').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    // Indexes
    table.index('user_id');
    table.index('razorpay_subscription_id');
    table.index('status');
  });

  // Add plan column to users table for quick access
  await knex.schema.withSchema('auth').alterTable('users', (table) => {
    table.enum('plan', ['free', 'pro', 'team']).notNullable().defaultTo('free');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema('auth').alterTable('users', (table) => {
    table.dropColumn('plan');
  });
  await knex.schema.withSchema('auth').dropTableIfExists('subscriptions');
}
