<script lang="ts">
	import { page } from '$app/state';
	import AppNav from '$lib/components/AppNav.svelte';
	import ActionCard from '$lib/components/ActionCard.svelte';
	import NetWorthCard from '$lib/components/NetWorthCard.svelte';
	import RecentTransactions from '$lib/components/RecentTransactions.svelte';
	import CategoriesCard from '$lib/components/CategoriesCard.svelte';
	import LogDrawer from '$lib/components/LogDrawer.svelte';
	import EditNetWorthDrawer from '$lib/components/EditNetWorthDrawer.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Search from 'lucide-svelte/icons/search';
	import { formatDollars, type Kind } from '$lib/finance';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const initialDrawer = page.url.searchParams.get('drawer');
	let drawer = $state<Kind | null>(
		initialDrawer === 'income' || initialDrawer === 'expense' ? initialDrawer : null
	);
	let editing = $state(false);
	let toast = $state<{ kind: Kind | 'info'; message: string } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout>;

	function showToast(kind: Kind | 'info', message: string) {
		toast = { kind, message };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 3200);
	}

	function open(kind: Kind) {
		drawer = kind;
	}

	function onlogged(entry: { kind: Kind; amount: number; tag: string }) {
		drawer = null;
		showToast(
			entry.kind,
			`${entry.kind === 'income' ? 'Income' : 'Expense'} of $${formatDollars(entry.amount)} logged · ${entry.tag}`
		);
	}

	function onNetWorthSaved(amount: number) {
		editing = false;
		showToast('info', `Net worth updated to $${formatDollars(amount)}`);
	}

	// I / E open the matching drawer when nothing else is focused and no drawer
	// is already open (mirrors the prototype's global shortcut).
	function onkeydown(e: KeyboardEvent) {
		if (drawer || editing) return;
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA') return;
		if (e.key === 'i' || e.key === 'I') {
			e.preventDefault();
			open('income');
		} else if (e.key === 'e' || e.key === 'E') {
			e.preventDefault();
			open('expense');
		}
	}

	const d = $derived(data.dashboard);
</script>

<svelte:head>
	<title>Dashboard · finTrack</title>
</svelte:head>

<svelte:window {onkeydown} />

<div class="ft-root">
	<AppNav name={data.user.name} initials={data.user.initials} />

	<main class="ft-main">
		<div class="ft-greeting">
			<div>
				<h1 class="ft-h1">{data.greeting}, {data.user.name}</h1>
				<p class="ft-sub">{data.dateStr}</p>
			</div>
			<div class="ft-search">
				<Search size={14} />
				<input placeholder="Search transactions…" aria-label="Search transactions" />
				<kbd class="ft-search-kbd">K (coming soon)</kbd>
			</div>
		</div>

		<div class="ft-actions-row">
			<ActionCard kind="income" last={d.lastIncome} shortcut="I" onclick={() => open('income')} />
			<ActionCard
				kind="expense"
				last={d.lastExpense}
				shortcut="E"
				onclick={() => open('expense')}
			/>
		</div>

		<NetWorthCard
			current={d.netWorth.current}
			deltaMonth={d.netWorth.deltaMonth}
			deltaPctMonth={d.netWorth.deltaPctMonth}
			history={d.history}
			onedit={() => (editing = true)}
		/>

		<div class="ft-bottom-grid">
			<RecentTransactions items={d.recent} />
			<CategoriesCard categories={d.categories} total={d.spendingTotal} />
		</div>
	</main>

	{#if drawer}
		<LogDrawer kind={drawer} onclose={() => (drawer = null)} {onlogged} />
	{/if}

	{#if editing}
		<EditNetWorthDrawer
			current={d.netWorth.current}
			onclose={() => (editing = false)}
			onsaved={onNetWorthSaved}
		/>
	{/if}

	{#if toast}
		<Toast kind={toast.kind} message={toast.message} />
	{/if}
</div>
