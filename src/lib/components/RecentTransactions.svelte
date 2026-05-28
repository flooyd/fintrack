<script lang="ts">
	import TransactionIcon from './TransactionIcon.svelte';
	import ImportButton from './ImportButton.svelte';
	import { formatSigned } from '$lib/finance';
	import type { LedgerEntry } from '$lib/server/dashboard';

	let {
		items,
		onedit,
		onimport
	}: {
		items: LedgerEntry[];
		onedit: (entry: LedgerEntry) => void;
		onimport: (result: { imported: number; scanned?: number; message?: string }) => void;
	} = $props();
</script>

<section class="ft-card ft-recent">
	<div class="ft-card-head">
		<h3 class="ft-card-title">Recent activity</h3>
		<ImportButton {onimport} />
	</div>

	{#if items.length === 0}
		<div class="ft-empty"><strong>Nothing logged yet</strong>Your entries will show up here.</div>
	{:else}
		<ul class="ft-tx-list">
			{#each items as t (t.id)}
				<li class="ft-tx">
					<button
						type="button"
						class="ft-tx-row"
						onclick={() => onedit(t)}
						aria-label="Edit {t.label}"
					>
						<span class="ft-tx-icon ft-tx-icon-{t.kind}">
							<TransactionIcon name={t.icon} size={16} />
						</span>
						<span class="ft-tx-main">
							<span class="ft-tx-label">{t.label}</span>
							<span class="ft-tx-meta">
								<span class="ft-tx-when">{t.when}</span>
								{#if t.sub}
									<span class="ft-tx-sep" aria-hidden="true">·</span>
									<span class="ft-tx-sub">{t.sub}</span>
								{/if}
							</span>
						</span>
						<span class="ft-tx-amt {t.kind === 'income' ? 'pos' : 'neg'}">
							{formatSigned(t.kind, t.amount)}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>
