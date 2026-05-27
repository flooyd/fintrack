import type { Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

// The /api/auth/* endpoints are served by src/routes/api/auth/[...all]/+server.ts.
// The hook only resolves the current session into `event.locals` for guards.
const handleBetterAuth: Handle = async ({ event, resolve }) => {
	try {
		const session = await auth.api.getSession({ headers: event.request.headers });
		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
		}
	} catch (err) {
		// Don't let a transient DB/session failure 500 every request — public
		// pages (marketing, login) should still render. Routes that require a
		// user guard on `locals.user` themselves.
		console.error('[auth] getSession failed:', err);
	}

	return resolve(event);
};

export const handle: Handle = handleBetterAuth;
