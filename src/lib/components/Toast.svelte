<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import Minus from 'lucide-svelte/icons/minus';
	import Check from 'lucide-svelte/icons/check';
	import type { Kind } from '$lib/finance';

	let { kind, message }: { kind: Kind | 'info'; message: string } = $props();
</script>

<div class="ft-toast" role="status" aria-live="polite">
	<span class="ft-tx-icon ft-tx-icon-{kind}">
		{#if kind === 'income'}
			<Plus size={14} strokeWidth={2.4} />
		{:else if kind === 'expense'}
			<Minus size={14} strokeWidth={2.4} />
		{:else}
			<Check size={14} strokeWidth={2.4} />
		{/if}
	</span>
	<span>{message}</span>
</div>
