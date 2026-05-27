<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import NetWorthChart from '$lib/components/NetWorthChart.svelte';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import Plus from 'lucide-svelte/icons/plus';
	import Minus from 'lucide-svelte/icons/minus';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Illustrative net-worth curve for the hero/landing previews.
	const previewHistory = [
		{ label: "Jun '25", value: 32100 },
		{ label: "Jul '25", value: 33480 },
		{ label: "Aug '25", value: 34020 },
		{ label: "Sep '25", value: 36110 },
		{ label: "Oct '25", value: 38240 },
		{ label: "Nov '25", value: 39880 },
		{ label: "Dec '25", value: 41200 },
		{ label: "Jan '26", value: 42010 },
		{ label: "Feb '26", value: 43580 },
		{ label: "Mar '26", value: 45120 },
		{ label: "Apr '26", value: 46970 },
		{ label: "May '26", value: 48210 }
	];

	const features = [
		{
			icon: KeyRound,
			title: 'Log in 30 seconds',
			body: 'Hit I for income, E for expense. Pick a category, type an amount, done. No more multi-step forms.',
			kbd: 'I / E'
		},
		{
			icon: TrendingUp,
			title: 'Net worth, plotted',
			body: 'Watch the line go up over weeks, months, years. The progress bar that actually matters.',
			kbd: '↑ 2.6%'
		},
		{
			icon: Sparkles,
			title: 'Spending, decoded',
			body: 'Automatic category breakdowns show exactly where the money went — without spreadsheets or rules engines.',
			kbd: 'Auto'
		}
	];

	const steps = [
		{ n: '01', title: 'Sign up', body: 'Email + password. Or Google. 20 seconds.' },
		{
			n: '02',
			title: 'Log a few entries',
			body: "Income, rent, groceries — whatever's top of mind."
		},
		{ n: '03', title: 'Check back daily', body: '30 seconds a day. Watch your net worth climb.' }
	];
</script>

<svelte:head>
	<title>finTrack — track every dollar, watch it grow</title>
	<meta
		name="description"
		content="A simple money tracker that gets out of your way. Log income and expenses with a single keystroke and watch your net worth climb in real time."
	/>
</svelte:head>

<div class="mk-root">
	<MarketingNav loggedIn={data.loggedIn} />

	<!-- Hero -->
	<section class="mk-hero">
		<div class="mk-hero-inner">
			<div class="mk-hero-copy">
				<span class="mk-pill">
					<Sparkles size={12} strokeWidth={2} />
					Built for daily 30-second check-ins
				</span>
				<h1 class="mk-h1">
					Track every dollar.<br />
					<span class="mk-h1-accent">Watch it grow.</span>
				</h1>
				<p class="mk-lede">
					A simple money tracker that gets out of your way. Log income and expenses with a single
					keystroke — see your net worth climb in real time.
				</p>
				<div class="mk-cta-row">
					{#if data.loggedIn}
						<a class="ft-btn ft-btn-primary ft-btn-lg" href="/app">Go to dashboard</a>
					{:else}
						<a class="ft-btn ft-btn-primary ft-btn-lg" href="/login?mode=signup"
							>Get started — free</a
						>
					{/if}
				</div>
				<div class="mk-meta">
					<span>No credit card</span>
					<span class="mk-dot">·</span>
					<span>Private by default</span>
					<span class="mk-dot">·</span>
					<span>Export anytime</span>
				</div>
			</div>

			<div class="mk-hero-preview">
				<div class="mk-hero-preview-stack">
					<div class="mk-preview-card mk-preview-card-main">
						<div class="mk-preview-head">
							<div>
								<div class="ft-eyebrow">Net worth</div>
								<div class="mk-preview-value">
									<span class="ft-money-symbol">$</span>48,210<span class="mk-preview-cents"
										>.42</span
									>
								</div>
								<div class="mk-preview-delta">
									<span class="ft-delta-badge pos">
										<ArrowUpRight size={11} strokeWidth={2.4} />
										+$1,240 (2.6%)
									</span>
									<span style="color: var(--ink-mute); font-size: 12px;">this month</span>
								</div>
							</div>
							<div class="ft-range-toggle">
								<button class="ft-range-btn" type="button">1M</button>
								<button class="ft-range-btn" type="button">6M</button>
								<button class="ft-range-btn active" type="button">1Y</button>
								<button class="ft-range-btn" type="button">ALL</button>
							</div>
						</div>
						<div class="mk-preview-chart">
							<NetWorthChart data={previewHistory} height={180} gradientId="ftAreaHero" />
						</div>
					</div>

					<div class="mk-float mk-float-income">
						<span
							class="ft-action-icon ft-action-icon-income"
							style="width: 28px; height: 28px; border-radius: 7px;"
						>
							<Plus size={14} strokeWidth={2.4} />
						</span>
						<div>
							<div class="mk-float-label">Income logged</div>
							<div class="mk-float-amt pos">+$3,200.00</div>
						</div>
						<kbd class="mk-float-kbd">I</kbd>
					</div>

					<div class="mk-float mk-float-expense">
						<span
							class="ft-action-icon ft-action-icon-expense"
							style="width: 28px; height: 28px; border-radius: 7px;"
						>
							<Minus size={14} strokeWidth={2.4} />
						</span>
						<div>
							<div class="mk-float-label">Expense logged</div>
							<div class="mk-float-amt">−$54.20</div>
						</div>
						<kbd class="mk-float-kbd">E</kbd>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="mk-features" id="features">
		<div class="mk-section-head">
			<span class="ft-eyebrow">Why finTrack</span>
			<h2 class="mk-h2">Money tracking, minus the chores</h2>
		</div>
		<div class="mk-feature-grid">
			{#each features as f (f.title)}
				<div class="mk-feature">
					<div class="mk-feature-head">
						<span class="mk-feature-icon"><f.icon size={20} strokeWidth={1.8} /></span>
						<span class="mk-feature-kbd">{f.kbd}</span>
					</div>
					<h3 class="mk-feature-title">{f.title}</h3>
					<p class="mk-feature-body">{f.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- How it works -->
	<section class="mk-how" id="how">
		<div class="mk-section-head">
			<span class="ft-eyebrow">How it works</span>
			<h2 class="mk-h2">Three steps, then a habit</h2>
		</div>
		<ol class="mk-steps">
			{#each steps as s (s.n)}
				<li class="mk-step">
					<div class="mk-step-n">{s.n}</div>
					<div class="mk-step-title">{s.title}</div>
					<div class="mk-step-body">{s.body}</div>
				</li>
			{/each}
		</ol>
	</section>

	<!-- Pricing -->
	<section class="mk-pricing" id="pricing">
		<div class="mk-section-head">
			<span class="ft-eyebrow">Pricing</span>
			<h2 class="mk-h2">Simple, like the product</h2>
		</div>
		<div class="mk-price-grid">
			<div class="mk-price-card">
				<div class="mk-price-name">Free</div>
				<div class="mk-price-num">
					<span class="ft-money-symbol">$</span>0<span class="mk-price-per">/forever</span>
				</div>
				<div class="mk-price-tag">Everything you need</div>
				<ul class="mk-price-list">
					<li>Unlimited income &amp; expense entries</li>
					<li>Net worth tracking</li>
					<li>Category breakdowns</li>
					<li>CSV export</li>
				</ul>
				<a class="ft-btn ft-btn-ghost ft-btn-lg mk-price-cta" href="/login?mode=signup">
					Get started
				</a>
			</div>

			<div class="mk-price-card mk-price-card-featured">
				<div class="mk-price-name">
					Plus
					<span class="mk-badge">Coming soon</span>
				</div>
				<div class="mk-price-num">
					<span class="ft-money-symbol">$</span>4<span class="mk-price-per">/month</span>
				</div>
				<div class="mk-price-tag">For the truly committed</div>
				<ul class="mk-price-list">
					<li>Bank-account sync</li>
					<li>Recurring transactions</li>
					<li>Budgets &amp; alerts</li>
					<li>Multi-currency</li>
				</ul>
				<a class="ft-btn ft-btn-primary ft-btn-lg mk-price-cta" href="/login?mode=signup">
					Join the waitlist
				</a>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="mk-cta">
		<div class="mk-cta-card">
			<h2 class="mk-cta-h2">Your future net worth thanks you.</h2>
			<p class="mk-cta-sub">Sign up in 20 seconds. Log your first entry in 10 more.</p>
			<a class="ft-btn ft-btn-primary ft-btn-lg" href="/login?mode=signup">Get started — free</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="mk-foot">
		<div class="mk-foot-inner">
			<Logo interactive={false} />
			<div class="mk-foot-links">
				<a href="#features">Features</a>
				<a href="#pricing">Pricing</a>
				{#if data.loggedIn}
					<a href="/app">Dashboard</a>
				{:else}
					<a href="/login">Log in</a>
					<a href="/login?mode=signup">Sign up</a>
				{/if}
			</div>
			<div class="mk-foot-meta">© 2026 finTrack</div>
		</div>
	</footer>
</div>
