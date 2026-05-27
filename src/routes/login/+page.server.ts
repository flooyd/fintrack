import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { enabledSocial, type SocialProvider } from '$lib/server/social';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		throw redirect(302, '/app');
	}
	return {
		mode: event.url.searchParams.get('mode') === 'signup' ? 'signup' : 'login',
		social: { google: enabledSocial.google, github: enabledSocial.github }
	};
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const rememberMe = formData.get('remember') === 'on';

		if (!email || password.length < 1) {
			return fail(400, { mode: 'login', email, message: 'Enter your email and password.' });
		}

		try {
			await auth.api.signInEmail({
				body: { email, password, rememberMe },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { mode: 'login', email, message: 'Incorrect email or password.' });
			}
			return fail(500, { mode: 'login', email, message: 'Something went wrong. Try again.' });
		}

		throw redirect(302, '/app');
	},

	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString().trim() ?? '';

		if (!name) {
			return fail(400, { mode: 'signup', email, name, message: 'What should we call you?' });
		}
		if (password.length < 8) {
			return fail(400, {
				mode: 'signup',
				email,
				name,
				message: 'Password should be at least 8 characters.'
			});
		}

		try {
			await auth.api.signUpEmail({
				body: { email, password, name },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					mode: 'signup',
					email,
					name,
					message: error.message || 'Could not create your account.'
				});
			}
			return fail(500, {
				mode: 'signup',
				email,
				name,
				message: 'Something went wrong. Try again.'
			});
		}

		throw redirect(302, '/app');
	},

	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const provider = formData.get('provider')?.toString() as SocialProvider;

		if (!provider || !enabledSocial[provider]) {
			return fail(400, { message: 'That sign-in method is not available.' });
		}

		const result = await auth.api.signInSocial({
			body: { provider, callbackURL: '/app' },
			headers: event.request.headers
		});

		if (result.url) {
			throw redirect(302, result.url);
		}
		return fail(400, { message: 'Could not start social sign-in.' });
	}
};
