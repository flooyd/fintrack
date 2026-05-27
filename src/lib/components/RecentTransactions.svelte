<script lang="ts">
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import TransactionIcon from './TransactionIcon.svelte';
	import { formatSigned } from '$lib/finance';
	import type { LedgerEntry } from '$lib/server/dashboard';

	let { items }: { items: LedgerEntry[] } = $props();
</script>

<section class="ft-card ft-recent">
	<div class="ft-card-head">
		<h3 class="ft-card-title">Recent activity</h3>
		<a class="ft-card-link" href="/app">View all <ChevronRight size={12} strokeWidth={2.4} /></a>
	</div>

	{#if items.length === 0}
		<div class="ft-empty"><strong>Nothing logged yet</strong>Your entries will show up here.</div>
	{:else}
		<ul class="ft-tx-list">
			{#each items as t (t.id)}
				<li class="ft-tx">
					<span class="ft-tx-icon ft-tx-icon-{t.kind}">
						<TransactionIcon name={t.icon} size={16} />
					</span>
					<span class="ft-tx-main">
						<span class="ft-tx-label">{t.label}</span>
						{#if t.sub}<span class="ft-tx-sub">{t.sub}</span>{/if}
					</span>
					<span class="ft-tx-when">{t.when}</span>
					<span class="ft-tx-amt {t.kind === 'income' ? 'pos' : 'neg'}">
						{formatSigned(t.kind, t.amount)}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
