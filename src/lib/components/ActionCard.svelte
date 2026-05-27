<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import Minus from 'lucide-svelte/icons/minus';
	import { formatSigned, type Kind } from '$lib/finance';

	let {
		kind,
		last,
		shortcut,
		onclick
	}: {
		kind: Kind;
		last: { amount: number; label: string; when: string } | null;
		shortcut: string;
		onclick: () => void;
	} = $props();

	const isIncome = $derived(kind === 'income');
</script>

<button class="ft-action ft-action-{kind}" type="button" {onclick}>
	<div class="ft-action-top">
		<span class="ft-action-icon ft-action-icon-{kind}">
			{#if isIncome}
				<Plus size={22} strokeWidth={2.2} />
			{:else}
				<Minus size={22} strokeWidth={2.2} />
			{/if}
		</span>
		<span class="ft-action-shortcut">press <kbd>{shortcut}</kbd></span>
	</div>

	<div class="ft-action-title">{isIncome ? 'Add income' : 'Add expense'}</div>

	<div class="ft-action-last">
		{#if last}
			<span class="ft-action-last-label">Last</span>
			<span class="ft-action-last-value">{formatSigned(kind, last.amount)}</span>
			<span class="ft-action-last-sep">·</span>
			<span class="ft-action-last-tag">{last.label}</span>
		{:else}
			<span class="ft-action-last-label">Last</span>
			<span class="ft-action-last-tag">No entries yet</span>
		{/if}
	</div>
</button>
