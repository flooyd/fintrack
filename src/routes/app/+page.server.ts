import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { transaction } from '$lib/server/db/schema';
import { getDashboardData, setNetWorth } from '$lib/server/dashboard';
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
