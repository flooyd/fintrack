import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const loggedIn = Boolean(event.locals.user);

	// A bare visit to the origin sends a logged-in user to their dashboard. The
	// in-app "About" and brand links pass `?home`, which lets a logged-in user
	// deliberately view the marketing page instead of bouncing to /app.
	if (loggedIn && !event.url.searchParams.has('home')) {
		throw redirect(302, '/app');
	}

	return { loggedIn };
};
