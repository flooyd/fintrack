import { eq, asc } from 'drizzle-orm';
import { db } from './db';
import { transaction, accountSettings } from './db/schema';
import { colorForCategory, iconForTag, type Kind } from '$lib/finance';

export type HistoryPoint = { label: string; value: number };
export type LedgerEntry = {
	id: string;
	kind: Kind;
	amount: number;
	label: string;
	sub: string;
	when: string;
	icon: string;
};
export type CategorySlice = { label: string; value: number; color: string };

export type DashboardData = {
	netWorth: { current: number; deltaMonth: number; deltaPctMonth: number };
	history: HistoryPoint[];
	lastIncome: { amount: number; label: string; when: string } | null;
	lastExpense: { amount: number; label: string; when: string } | null;
	recent: LedgerEntry[];
	categories: CategorySlice[];
	spendingTotal: number;
};

const dollars = (c: number) => c / 100;

function startOfDay(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function relativeDay(d: Date, now: Date): string {
	const diff = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86_400_000);
	if (diff === 0) return 'Today';
	if (diff === 1) return 'Yesterday';
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function monthLabel(d: Date): string {
	return `${d.toLocaleDateString('en-US', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

/** Build the full dashboard payload from a user's ledger. */
export async function getDashboardData(userId: string, now = new Date()): Promise<DashboardData> {
	const [rows, [settings]] = await Promise.all([
		db
			.select()
			.from(transaction)
			.where(eq(transaction.userId, userId))
			.orderBy(asc(transaction.occurredAt)),
		db.select().from(accountSettings).where(eq(accountSettings.userId, userId))
	]);

	// Manual opening balance; net worth = baseline + signed ledger sum.
	const baselineCents = settings?.netWorthBaselineCents ?? 0;

	if (rows.length === 0) {
		return {
			netWorth: { current: dollars(baselineCents), deltaMonth: 0, deltaPctMonth: 0 },
			history: [],
			lastIncome: null,
			lastExpense: null,
			recent: [],
			categories: [],
			spendingTotal: 0
		};
	}

	// Net worth + per-month net flow (in cents). The baseline seeds the total
	// and the cumulative curve so the whole series shifts with it.
	let totalCents = baselineCents;
	const monthlyNet = new Map<string, number>();
	for (const r of rows) {
		const signed = r.kind === 'income' ? r.amountCents : -r.amountCents;
		totalCents += signed;
		const k = monthKey(r.occurredAt);
		monthlyNet.set(k, (monthlyNet.get(k) ?? 0) + signed);
	}

	// Monthly cumulative history, walking every month from the first entry to now
	// so gaps carry the running balance forward (a flat segment, never a hole).
	const history: HistoryPoint[] = [];
	const first = rows[0].occurredAt;
	const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
	const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	let running = baselineCents;
	while (cursor <= lastMonth) {
		running += monthlyNet.get(monthKey(cursor)) ?? 0;
		history.push({ label: monthLabel(cursor), value: dollars(running) });
		cursor.setMonth(cursor.getMonth() + 1);
	}

	const deltaMonthCents = monthlyNet.get(monthKey(now)) ?? 0;
	const prevCents = totalCents - deltaMonthCents;
	const deltaPctMonth = prevCents !== 0 ? (deltaMonthCents / Math.abs(prevCents)) * 100 : 0;

	// Most-recent income / expense for the action-card "last" lines.
	let lastIncome: DashboardData['lastIncome'] = null;
	let lastExpense: DashboardData['lastExpense'] = null;
	for (let i = rows.length - 1; i >= 0 && (!lastIncome || !lastExpense); i--) {
		const r = rows[i];
		if (r.kind === 'income' && !lastIncome) {
			lastIncome = {
				amount: dollars(r.amountCents),
				label: r.tag,
				when: relativeDay(r.occurredAt, now)
			};
		} else if (r.kind === 'expense' && !lastExpense) {
			lastExpense = {
				amount: dollars(r.amountCents),
				label: r.tag,
				when: relativeDay(r.occurredAt, now)
			};
		}
	}

	// Recent activity — newest first. We show enough rows that a same-day CSV
	// import plus today's manual entries all fit on screen, so duplicates are
	// reachable for deletion.
	const recent: LedgerEntry[] = [...rows]
		.reverse()
		.slice(0, 20)
		.map((r) => ({
			id: r.id,
			kind: r.kind,
			amount: dollars(r.amountCents),
			label: r.tag,
			sub: r.note ?? '',
			when: relativeDay(r.occurredAt, now),
			icon: iconForTag(r.kind, r.tag)
		}));

	// Spending this (calendar) month, grouped by category.
	const thisMonth = monthKey(now);
	const catTotals = new Map<string, number>();
	for (const r of rows) {
		if (r.kind === 'expense' && monthKey(r.occurredAt) === thisMonth) {
			catTotals.set(r.tag, (catTotals.get(r.tag) ?? 0) + r.amountCents);
		}
	}
	const categories: CategorySlice[] = [...catTotals.entries()]
		.map(([label, c]) => ({ label, value: dollars(c) }))
		.sort((a, b) => b.value - a.value)
		.map((c, i) => ({ ...c, color: colorForCategory(c.label, i) }));
	const spendingTotal = categories.reduce((s, c) => s + c.value, 0);

	return {
		netWorth: {
			current: dollars(totalCents),
			deltaMonth: dollars(deltaMonthCents),
			deltaPctMonth
		},
		history,
		lastIncome,
		lastExpense,
		recent,
		categories,
		spendingTotal
	};
}

/**
 * Directly set a user's net worth by adjusting the manual baseline so that
 * `baseline + signed ledger sum === target`. Idempotent: callable any time.
 */
export async function setNetWorth(userId: string, targetDollars: number): Promise<void> {
	const targetCents = Math.round(targetDollars * 100);

	const rows = await db
		.select({ kind: transaction.kind, amountCents: transaction.amountCents })
		.from(transaction)
		.where(eq(transaction.userId, userId));
	const ledgerCents = rows.reduce(
		(s, r) => s + (r.kind === 'income' ? r.amountCents : -r.amountCents),
		0
	);
	const baselineCents = targetCents - ledgerCents;

	await db
		.insert(accountSettings)
		.values({ userId, netWorthBaselineCents: baselineCents })
		.onConflictDoUpdate({
			target: accountSettings.userId,
			set: { netWorthBaselineCents: baselineCents, updatedAt: new Date() }
		});
}
