<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import NetWorthChart from '$lib/components/NetWorthChart.svelte';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Initialise local form state once from the server payload; these are then
	// independently editable (untrack keeps them from re-syncing on prop change).
	let mode = $state<'login' | 'signup'>(
		untrack(() => (data.mode === 'signup' ? 'signup' : 'login'))
	);
	let email = $state(untrack(() => form?.email ?? ''));
	let name = $state(untrack(() => (form && 'name' in form ? (form.name ?? '') : '')));
	let password = $state('');
	let remember = $state(true);
	let loading = $state(false);
	let socialLoading = $state<string | null>(null);

	const isSignup = $derived(mode === 'signup');
	const anySocial = $derived(data.social.google || data.social.github);

	const sidePreview = [
		{ label: "Dec '25", value: 41200 },
		{ label: "Jan '26", value: 42010 },
		{ label: "Feb '26", value: 43580 },
		{ label: "Mar '26", value: 45120 },
		{ label: "Apr '26", value: 46970 },
		{ label: "May '26", value: 48210 }
	];

	function setMode(next: 'login' | 'signup') {
		mode = next;
		const url = new URL(page.url);
		if (next === 'signup') url.searchParams.set('mode', 'signup');
		else url.searchParams.delete('mode');
		replaceState(url, {});
	}

	const submitEmail: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			await update({ reset: false });
			loading = false;
		};
	};

	// Social sign-in redirects to an external OAuth provider, so we let the form
	// POST natively (the browser follows the cross-origin 302) rather than
	// intercepting with enhance. We just flag the loading label first.
	function startSocial(provider: string) {
		socialLoading = provider;
	}
</script>

<svelte:head>
	<title>{isSignup ? 'Create your account' : 'Log in'} · finTrack</title>
</svelte:head>

<div class="lg-root">
	<div class="lg-nav">
		<Logo href="/" />
	</div>

	<div class="lg-main">
		<aside class="lg-side">
			<div class="lg-side-inner">
				<h2 class="lg-side-title">Your money, on a single page.</h2>
				<p class="lg-side-body">
					Log income and expenses in seconds. Watch your net worth climb. No spreadsheets, no
					chores.
				</p>

				<div class="lg-side-preview">
					<div class="ft-eyebrow" style="font-size: 10px;">Net worth · 6M</div>
					<div class="mk-preview-value" style="font-size: 28px; margin-top: 4px;">
						<span class="ft-money-symbol" style="font-size: 16px;">$</span>48,210<span
							class="mk-preview-cents"
							style="font-size: 14px;">.42</span
						>
					</div>
					<div class="mk-preview-delta" style="margin-top: 6px;">
						<span class="ft-delta-badge pos" style="font-size: 11.5px;">
							<ArrowUpRight size={11} strokeWidth={2.4} />
							+$1,240 (2.6%)
						</span>
					</div>
					<div style="margin-top: 10px;">
						<NetWorthChart data={sidePreview} height={120} gradientId="ftAreaSide" />
					</div>
				</div>
			</div>
		</aside>

		<div class="lg-form-wrap">
			<div class="lg-card">
				<div class="lg-tabs" role="tablist">
					<button
						type="button"
						role="tab"
						class="lg-tab {!isSignup ? 'active' : ''}"
						aria-selected={!isSignup}
						onclick={() => setMode('login')}>Log in</button
					>
					<button
						type="button"
						role="tab"
						class="lg-tab {isSignup ? 'active' : ''}"
						aria-selected={isSignup}
						onclick={() => setMode('signup')}>Sign up</button
					>
				</div>

				<h1 class="lg-title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
				<p class="lg-sub">
					{isSignup ? 'Start tracking in under a minute.' : 'Log in to your finTrack.'}
				</p>

				{#if form?.message}
					<div class="lg-error">{form.message}</div>
				{/if}

				{#if anySocial}
					<div class="lg-social">
						{#if data.social.google}
							<form method="post" action="?/signInSocial" onsubmit={() => startSocial('google')}>
								<input type="hidden" name="provider" value="google" />
								<button class="lg-social-btn" type="submit" disabled={socialLoading !== null}>
									<svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
										<path
											fill="#4285F4"
											d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8c-.2 1.1-.8 2-1.7 2.6v2.2h2.8c1.6-1.5 2.7-3.7 2.7-6.4Z"
										/>
										<path
											fill="#34A853"
											d="M9 18c2.4 0 4.4-.8 5.9-2.2l-2.8-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9V13c1.5 2.9 4.5 5 8.1 5Z"
										/>
										<path
											fill="#FBBC05"
											d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5.1H.9C.3 6.3 0 7.6 0 9s.3 2.7.9 3.9l3-2.2Z"
										/>
										<path
											fill="#EA4335"
											d="M9 3.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6C13.4.9 11.4 0 9 0 5.4 0 2.4 2.1.9 5.1l3 2.2C4.6 5.1 6.6 3.6 9 3.6Z"
										/>
									</svg>
									{socialLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
								</button>
							</form>
						{/if}
						{#if data.social.github}
							<form method="post" action="?/signInSocial" onsubmit={() => startSocial('github')}>
								<input type="hidden" name="provider" value="github" />
								<button class="lg-social-btn" type="submit" disabled={socialLoading !== null}>
									<svg
										width="16"
										height="16"
										viewBox="0 0 16 16"
										fill="currentColor"
										aria-hidden="true"
									>
										<path
											d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
										/>
									</svg>
									{socialLoading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
								</button>
							</form>
						{/if}
					</div>

					<div class="lg-divider">or with email</div>
				{/if}

				<form
					class="lg-form"
					method="post"
					action={isSignup ? '?/signUpEmail' : '?/signInEmail'}
					use:enhance={submitEmail}
				>
					{#if isSignup}
						<div class="lg-input-row">
							<div class="lg-input-label-row"><span>Name</span></div>
							<input
								class="lg-input"
								type="text"
								name="name"
								placeholder="Your name"
								bind:value={name}
								required
							/>
						</div>
					{/if}

					<div class="lg-input-row">
						<div class="lg-input-label-row"><span>Email</span></div>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="lg-input"
							type="email"
							name="email"
							placeholder="you@example.com"
							bind:value={email}
							required
							autofocus
						/>
					</div>

					<div class="lg-input-row">
						<div class="lg-input-label-row">
							<span>Password</span>
							{#if !isSignup}<a href="/login">Forgot password?</a>{/if}
						</div>
						<input
							class="lg-input"
							type="password"
							name="password"
							placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
							bind:value={password}
							required
							minlength={isSignup ? 8 : 6}
						/>
					</div>

					{#if !isSignup}
						<label class="lg-checkbox">
							<input type="checkbox" name="remember" bind:checked={remember} />
							Keep me logged in
						</label>
					{/if}

					<button class="ft-btn ft-btn-primary lg-submit" type="submit" disabled={loading}>
						{#if loading}
							{isSignup ? 'Creating account…' : 'Logging in…'}
						{:else}
							{isSignup ? 'Create account' : 'Log in'}
						{/if}
					</button>
				</form>

				<div class="lg-foot">
					{#if isSignup}
						Already have an account?
						<a
							href="/login"
							onclick={(e) => {
								e.preventDefault();
								setMode('login');
							}}>Log in</a
						>
					{:else}
						New to finTrack?
						<a
							href="/login?mode=signup"
							onclick={(e) => {
								e.preventDefault();
								setMode('signup');
							}}
						>
							Create an account
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
