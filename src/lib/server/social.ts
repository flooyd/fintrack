import { env } from '$env/dynamic/private';

/**
 * Which social providers are fully configured. The login screen uses this to
 * render a button only when its OAuth credentials are present, so we never show
 * a button that would dead-end. Mirrors the `socialProviders` map in `auth.ts`.
 */
export const enabledSocial = {
	get google() {
		return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
	},
	get github() {
		return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
	}
};

export type SocialProvider = 'google' | 'github';
