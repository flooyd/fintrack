<script lang="ts">
	import { formatWhole } from '$lib/finance';
	import type { CategorySlice } from '$lib/server/dashboard';

	let { categories, total }: { categories: CategorySlice[]; total: number } = $props();

	const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
</script>

<section class="ft-card ft-categories">
	<div class="ft-card-head">
		<h3 class="ft-card-title">Spending this month</h3>
		<span class="ft-card-meta ft-money-mono">${formatWhole(total)}</span>
	</div>

	{#if categories.length === 0}
		<div class="ft-empty"><strong>No spending yet</strong>Log an expense to see the breakdown.</div>
	{:else}
		<div class="ft-cat-bar">
			{#each categories as c (c.label)}
				<span
					class="ft-cat-bar-seg"
					style="flex: {c.value}; background: {c.color};"
					title="{c.label}: ${formatWhole(c.value)}"
				></span>
			{/each}
		</div>

		<ul class="ft-cat-list">
			{#each categories as c (c.label)}
				<li class="ft-cat">
					<span class="ft-cat-dot" style="background: {c.color};"></span>
					<span class="ft-cat-label">{c.label}</span>
					<span class="ft-cat-value ft-money-mono">${formatWhole(c.value)}</span>
					<span class="ft-cat-pct">{pct(c.value)}%</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
