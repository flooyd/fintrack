<script lang="ts">
	import NetWorthChart from './NetWorthChart.svelte';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import ArrowDownRight from 'lucide-svelte/icons/arrow-down-right';
	import Pencil from 'lucide-svelte/icons/pencil';
	import { formatSigned } from '$lib/finance';
	import type { HistoryPoint } from '$lib/server/dashboard';

	let {
		current,
		deltaMonth,
		deltaPctMonth,
		history,
		onedit
	}: {
		current: number;
		deltaMonth: number;
		deltaPctMonth: number;
		history: HistoryPoint[];
		onedit: () => void;
	} = $props();

	const RANGES = ['1M', '6M', '1Y', 'ALL'] as const;
	type Range = (typeof RANGES)[number];
	let range = $state<Range>('1Y');

	const months = $derived<Record<Range, number>>({
		'1M': 2,
		'6M': 6,
		'1Y': 12,
		ALL: history.length
	});
	const slice = $derived(history.slice(-Math.max(2, months[range])));

	const positive = $derived(deltaMonth >= 0);
	const negative = $derived(current < 0);
	const whole = $derived(Math.floor(Math.abs(current)).toLocaleString('en-US'));
	const centsPart = $derived(Math.abs(current).toFixed(2).split('.')[1]);
</script>

<section class="ft-card ft-networth">
	<div class="ft-networth-head">
		<div>
			<div class="ft-eyebrow">Net worth</div>
			<div class="ft-networth-value">
				<span class="ft-money" class:neg={negative}>
					<span class="ft-money-symbol">{negative ? '−$' : '$'}</span>{whole}<span
						class="ft-money-cents">.{centsPart}</span
					>
				</span>
			</div>
			<div class="ft-networth-delta">
				<span class="ft-delta-badge {positive ? 'pos' : 'neg'}">
					{#if positive}
						<ArrowUpRight size={12} strokeWidth={2.4} />
					{:else}
						<ArrowDownRight size={12} strokeWidth={2.4} />
					{/if}
					{formatSigned(positive ? 'income' : 'expense', deltaMonth)}
					<span class="ft-delta-pct">({deltaPctMonth.toFixed(1)}%)</span>
				</span>
				<span class="ft-delta-period">this month</span>
			</div>
		</div>

		<div class="ft-networth-tools">
			<button class="ft-nw-edit" type="button" onclick={onedit}>
				<Pencil size={13} strokeWidth={2} />
				Edit
			</button>
			<div class="ft-range-toggle" role="tablist" aria-label="Chart range">
				{#each RANGES as r (r)}
					<button
						class="ft-range-btn {range === r ? 'active' : ''}"
						type="button"
						role="tab"
						aria-selected={range === r}
						onclick={() => (range = r)}
					>
						{r}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="ft-networth-chart">
		{#if slice.length > 0}
			<NetWorthChart data={slice} height={220} />
		{:else}
			<div class="ft-empty">
				<strong>No history yet</strong>Log a few entries to see your curve.
			</div>
		{/if}
	</div>
</section>
