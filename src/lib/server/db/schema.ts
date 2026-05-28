import { pgTable, text, integer, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth.schema';

/** Income adds to net worth; expense subtracts from it. */
export const transactionKind = pgEnum('transaction_kind', ['income', 'expense']);

/**
 * A single ledger entry. Money is stored as an integer number of cents
 * (`amountCents`) so we never accumulate floating-point drift; the sign is
 * always positive and the direction is carried by `kind`.
 */
export const transaction = pgTable(
	'transaction',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		kind: transactionKind('kind').notNull(),
		amountCents: integer('amount_cents').notNull(),
		/** Category (for expenses) or source (for income), e.g. "Housing", "Paycheck". */
		tag: text('tag').notNull(),
		note: text('note'),
		/** When the transaction happened — drives the ledger date + net-worth history. */
		occurredAt: timestamp('occurred_at').notNull().defaultNow(),
		/**
		 * Provenance: `null` = manual entry, `'cashapp'` = Cash App CSV import.
		 * Used to dedupe re-imports against prior imports (by occurredAt) without
		 * conflating them with same-time manual entries.
		 */
		origin: text('origin'),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [index('transaction_user_occurred_idx').on(table.userId, table.occurredAt)]
);

export const transactionRelations = relations(transaction, ({ one }) => ({
	user: one(user, {
		fields: [transaction.userId],
		references: [user.id]
	})
}));

/**
 * Per-user settings. `netWorthBaselineCents` is a manual opening balance: net
 * worth is shown as this baseline plus the signed sum of the ledger. Editing
 * net worth directly just sets this value, so it never pollutes the activity
 * feed or the spending breakdown.
 */
export const accountSettings = pgTable('account_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	netWorthBaselineCents: integer('net_worth_baseline_cents').notNull().default(0),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;

export * from './auth.schema';
