/**
 * Shared, client-safe finance helpers: the income/expense vocabularies the UI
 * offers, category → colour/icon mappings, and money formatters. The server's
 * dashboard builder (`$lib/server/dashboard.ts`) reuses the same maps so the
 * ledger and the breakdown agree on colours and icons.
 */

export type Kind = 'income' | 'expense';

/** Chip options offered in the "Add income" drawer. */
export const INCOME_SOURCES = [
	'Paycheck',
	'Freelance',
	'Dividend',
	'Interest',
	'Gift',
	'Other'
] as const;

/** Chip options offered in the "Add expense" drawer. */
export const EXPENSE_CATEGORIES = [
	'Housing',
	'Food & dining',
	'Transport',
	'Utilities',
	'Entertainment',
	'Health',
	'Shopping',
	'Other'
] as const;

export function tagsFor(kind: Kind): readonly string[] {
	return kind === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;
}

/** Muted, palette-coherent colours for the spending breakdown. */
const CATEGORY_COLORS: Record<string, string> = {
	Housing: '#7a8b6f',
	'Food & dining': '#a09262',
	Transport: '#9a6a5e',
	Utilities: '#6f7a8b',
	Health: '#8a7a9a',
	Entertainment: '#c0875e',
	Shopping: '#7a9a8b',
	Other: '#bdb6a8'
};

const FALLBACK_PALETTE = ['#7a8b6f', '#a09262', '#9a6a5e', '#6f7a8b', '#8a7a9a', '#bdb6a8'];

export function colorForCategory(label: string, index = 0): string {
	return CATEGORY_COLORS[label] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

/**
 * Lucide icon name (kebab-case, resolved by `TransactionIcon.svelte`) for a
 * ledger entry, derived purely from its kind + tag so rows and the breakdown
 * stay consistent.
 */
export function iconForTag(kind: Kind, tag: string): string {
	if (kind === 'income') {
		const map: Record<string, string> = {
			Paycheck: 'wallet',
			Freelance: 'hand-coins',
			Dividend: 'trending-up',
			Interest: 'trending-up',
			Gift: 'gift'
		};
		return map[tag] ?? 'banknote';
	}
	const map: Record<string, string> = {
		Housing: 'house',
		'Food & dining': 'utensils',
		Transport: 'car',
		Utilities: 'wifi',
		Health: 'pill',
		Entertainment: 'music',
		Shopping: 'shopping-bag'
	};
	return map[tag] ?? 'receipt';
}

/** "3,200.00" — two decimals, grouped thousands. */
export function formatDollars(amount: number): string {
	return Math.abs(amount).toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

/** "$3,200" — whole dollars, grouped thousands. */
export function formatWhole(amount: number): string {
	return Math.round(amount).toLocaleString('en-US');
}

/** "+$3,200.00" / "−$54.20" using a true minus sign (U+2212). */
export function formatSigned(kind: Kind, amount: number): string {
	const sign = kind === 'income' ? '+' : '−';
	return `${sign}$${formatDollars(amount)}`;
}

/** Up-to-two-letter initials for an avatar, e.g. "Sam Carter" → "SC". */
export function initialsFor(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
