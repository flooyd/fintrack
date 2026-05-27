<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Pencil from 'lucide-svelte/icons/pencil';
	import X from 'lucide-svelte/icons/x';

	let {
		current,
		onclose,
		onsaved
	}: {
		current: number;
		onclose: () => void;
		onsaved: (amount: number) => void;
	} = $props();

	let amount = $state(untrack(() => current.toFixed(2)));
	let submitting = $state(false);
	let error = $state('');
	let amountEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		amountEl?.focus();
		amountEl?.select();
	});

	function onOverlayDown(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ft-drawer-overlay" onmousedown={onOverlayDown}>
	<div class="ft-drawer" role="dialog" aria-modal="true" aria-label="Edit net worth">
		<div class="ft-drawer-head">
			<div class="ft-drawer-title">
				<span class="ft-action-icon" style="width: 32px; height: 32px; background: var(--brand);">
					<Pencil size={15} strokeWidth={2.2} />
				</span>
				<span>Edit net worth</span>
			</div>
			<button class="ft-icon-btn" type="button" onclick={onclose} aria-label="Close">
				<X size={16} />
			</button>
		</div>

		<form
			class="ft-drawer-body"
			method="post"
			action="/app?/setNetWorth"
			use:enhance={() => {
				submitting = true;
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'success' && result.data?.success) {
						await update();
						onsaved(Number(result.data.amount));
					} else if (result.type === 'failure') {
						error = (result.data?.message as string) ?? 'Could not update net worth.';
					}
					submitting = false;
				};
			}}
		>
			{#if error}<div class="lg-error" style="margin: 0;">{error}</div>{/if}

			<label class="ft-field">
				<span class="ft-field-label">Net worth</span>
				<span class="ft-amount-input">
					<span class="ft-amount-prefix">$</span>
					<input
						bind:this={amountEl}
						type="number"
						name="amount"
						step="0.01"
						placeholder="0.00"
						bind:value={amount}
						required
					/>
				</span>
			</label>

			<p class="ft-field-hint">
				Sets your net worth directly. Logged income and expenses are added on top of this.
			</p>

			<div class="ft-drawer-foot">
				<button type="button" class="ft-btn ft-btn-ghost" onclick={onclose}>Cancel</button>
				<button type="submit" class="ft-btn ft-btn-primary" disabled={submitting}>
					Update net worth
					<kbd class="ft-btn-kbd">↵</kbd>
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.ft-field-hint {
		margin: -4px 0 0;
		font-size: 12.5px;
		color: var(--ink-mute);
		line-height: 1.5;
	}
</style>
