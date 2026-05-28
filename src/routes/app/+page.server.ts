import { fail, redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { transaction } from '$lib/server/db/schema';
import { getDashboardData, setNetWorth } from '$lib/server/dashboard';
import { parseCashAppCsv } from '$lib/server/csvImport';
import { initialsFor, EXPENSE_CATEGORIES, INCOME_SOURCES } from '$lib/finance';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login');
	}

	// New accounts start empty — net worth $0 until the user logs entries or sets
	// it directly.
	const dashboard = await getDashboardData(user.id);

	const now = new Date();
	const hour = now.getHours();
	const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
	const dateStr = now.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	return {
		user: { name: user.name, initials: initialsFor(user.name) },
		dashboard,
		greeting,
		dateStr
	};
};

export const actions: Actions = {
	addTransaction: async (event) => {
		if (!event.locals.user) {
			throw redirect(302, '/login');
		}

		const fd = await event.request.formData();
		const kind = fd.get('kind')?.toString();
		const amount = Number(fd.get('amount'));
		const tag = fd.get('tag')?.toString().trim() ?? '';
		const note = fd.get('note')?.toString().trim() || null;

		if (kind !== 'income' && kind !== 'expense') {
			return fail(400, { message: 'Pick income or expense.' });
		}
		const allowed = kind === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;
		if (!tag || !allowed.includes(tag as never)) {
			return fail(400, { message: 'Choose a valid category.' });
		}
		if (!Number.isFinite(amount) || amount <= 0) {
			return fail(400, { message: 'Enter an amount greater than zero.' });
		}

		await db.insert(transaction).values({
			userId: event.locals.user.id,
			kind,
			amountCents: Math.round(amount * 100),
			tag,
			note,
			occurredAt: new Date()
		});

		return { success: true as const, kind, amount, tag };
	},

	editTransaction: async (event) => {
		if (!event.locals.user) {
			throw redirect(302, '/login');
		}

		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		const kind = fd.get('kind')?.toString();
		const amount = Number(fd.get('amount'));
		const tag = fd.get('tag')?.toString().trim() ?? '';
		const note = fd.get('note')?.toString().trim() || null;

		if (!id) return fail(400, { message: 'Missing entry id.' });
		if (kind !== 'income' && kind !== 'expense') {
			return fail(400, { message: 'Pick income or expense.' });
		}
		const allowed = kind === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;
		if (!tag || !allowed.includes(tag as never)) {
			return fail(400, { message: 'Choose a valid category.' });
		}
		if (!Number.isFinite(amount) || amount <= 0) {
			return fail(400, { message: 'Enter an amount greater than zero.' });
		}

		const updated = await db
			.update(transaction)
			.set({
				kind,
				amountCents: Math.round(amount * 100),
				tag,
				note
			})
			.where(and(eq(transaction.id, id), eq(transaction.userId, event.locals.user.id)))
			.returning({ id: transaction.id });

		if (updated.length === 0) return fail(404, { message: 'Entry not found.' });
		return { success: true as const, edited: true as const, kind, amount, tag };
	},

	deleteTransaction: async (event) => {
		if (!event.locals.user) {
			throw redirect(302, '/login');
		}

		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing entry id.' });

		const deleted = await db
			.delete(transaction)
			.where(and(eq(transaction.id, id), eq(transaction.userId, event.locals.user.id)))
			.returning({ id: transaction.id });

		if (deleted.length === 0) return fail(404, { message: 'Entry not found.' });
		return { success: true as const, deleted: true as const };
	},

	importCashAppCsv: async (event) => {
		if (!event.locals.user) {
			throw redirect(302, '/login');
		}

		const fd = await event.request.formData();
		const file = fd.get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'Choose a CSV file to import.' });
		}
		if (file.size > 2_000_000) {
			return fail(400, { message: 'File too large — max 2 MB.' });
		}

		const text = await file.text();
		const now = new Date();
		const today = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

		let parsed;
		try {
			parsed = parseCashAppCsv(text, today);
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : 'Could not parse CSV.' });
		}

		if (parsed.rows.length === 0) {
			return {
				success: true as const,
				imported: 0,
				duplicates: 0,
				scanned: parsed.scanned,
				message: 'No matching transactions for today were found in this file.'
			};
		}

		// Dedupe against rows we've imported before (origin='cashapp' + identical
		// occurredAt). We deliberately ignore manual entries: if the user logged a
		// $10 expense at the same second a Cash App row claims, that's a coincidence
		// they can resolve in the UI — we won't silently drop their manual data.
		const candidateTimes = parsed.rows.map((r) => r.occurredAt);
		const existing = await db
			.select({ occurredAt: transaction.occurredAt })
			.from(transaction)
			.where(
				and(
					eq(transaction.userId, event.locals.user.id),
					eq(transaction.origin, 'cashapp'),
					inArray(transaction.occurredAt, candidateTimes)
				)
			);
		const alreadyImported = new Set(existing.map((r) => r.occurredAt.getTime()));
		const fresh = parsed.rows.filter((r) => !alreadyImported.has(r.occurredAt.getTime()));
		const duplicates = parsed.rows.length - fresh.length;

		if (fresh.length === 0) {
			return {
				success: true as const,
				imported: 0,
				duplicates,
				scanned: parsed.scanned,
				message: 'Already imported — no new transactions to add.'
			};
		}

		await db.insert(transaction).values(
			fresh.map((r) => ({
				userId: event.locals.user!.id,
				kind: r.kind,
				amountCents: r.amountCents,
				tag: r.tag,
				note: r.note,
				occurredAt: r.occurredAt,
				origin: 'cashapp'
			}))
		);

		return {
			success: true as const,
			imported: fresh.length,
			duplicates,
			scanned: parsed.scanned
		};
	},

	setNetWorth: async (event) => {
		if (!event.locals.user) {
			throw redirect(302, '/login');
		}

		const fd = await event.request.formData();
		const amount = Number(fd.get('amount'));
		if (!Number.isFinite(amount)) {
			return fail(400, { message: 'Enter a valid net worth amount.' });
		}

		await setNetWorth(event.locals.user.id, amount);
		return { success: true as const, netWorthSet: true as const, amount };
	},

	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		throw redirect(302, '/login');
	}
};
