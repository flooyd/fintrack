<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Plus from 'lucide-svelte/icons/plus';
	import Minus from 'lucide-svelte/icons/minus';
	import X from 'lucide-svelte/icons/x';
	import { tagsFor, type Kind } from '$lib/finance';

	let {
		kind,
		onclose,
		onlogged
	}: {
		kind: Kind;
		onclose: () => void;
		onlogged: (entry: { kind: Kind; amount: number; tag: string }) => void;
	} = $props();

	const isIncome = $derived(kind === 'income');
	const tags = $derived(tagsFor(kind));

	let amount = $state('');
	let tag = $state(untrack(() => tagsFor(kind)[0]));
	let note = $state('');
	let submitting = $state(false);
	let error = $state('');
	let amountEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		// Focus the amount field as the drawer mounts.
		amountEl?.focus();
	});

	function onOverlayDown(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ft-drawer-overlay" onmousedown={onOverlayDown}>
	<div
		class="ft-drawer ft-drawer-{kind}"
		role="dialog"
		aria-modal="true"
		aria-label={isIncome ? 'Add income' : 'Add expense'}
	>
		<div class="ft-drawer-head">
			<div class="ft-drawer-title">
				<span class="ft-action-icon ft-action-icon-{kind}" style="width: 32px; height: 32px;">
					{#if isIncome}
						<Plus size={16} strokeWidth={2.4} />
					{:else}
						<Minus size={16} strokeWidth={2.4} />
					{/if}
				</span>
				<span>{isIncome ? 'Add income' : 'Add expense'}</span>
			</div>
			<button class="ft-icon-btn" type="button" onclick={onclose} aria-label="Close">
				<X size={16} />
			</button>
		</div>

		<form
			class="ft-drawer-body"
			method="post"
			action="/app?/addTransaction"
			use:enhance={() => {
				submitting = true;
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'success' && result.data?.success) {
						await update();
						onlogged({ kind, amount: Number(result.data.amount), tag: String(result.data.tag) });
					} else if (result.type === 'failure') {
						error = (result.data?.message as string) ?? 'Could not log that entry.';
					}
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="kind" value={kind} />
			<input type="hidden" name="tag" value={tag} />

			{#if error}<div class="lg-error" style="margin: 0;">{error}</div>{/if}

			<label class="ft-field">
				<span class="ft-field-label">Amount</span>
				<span class="ft-amount-input">
					<span class="ft-amount-prefix">$</span>
					<input
						bind:this={amountEl}
						type="number"
						name="amount"
						step="0.01"
						min="0.01"
						placeholder="0.00"
						bind:value={amount}
						required
					/>
				</span>
			</label>

			<div class="ft-field">
				<span class="ft-field-label">{isIncome ? 'Source' : 'Category'}</span>
				<div class="ft-chip-row">
					{#each tags as t (t)}
						<button
							type="button"
							class="ft-chip {tag === t ? 'active' : ''}"
							onclick={() => (tag = t)}
						>
							{t}
						</button>
					{/each}
				</div>
			</div>

			<label class="ft-field">
				<span class="ft-field-label">Note <span class="ft-field-opt">(optional)</span></span>
				<input
					type="text"
					class="ft-text-input"
					name="note"
					placeholder="What was this for?"
					bind:value={note}
				/>
			</label>

			<div class="ft-drawer-foot">
				<button type="button" class="ft-btn ft-btn-ghost" onclick={onclose}>Cancel</button>
				<button type="submit" class="ft-btn ft-btn-{kind}" disabled={submitting}>
					Log {isIncome ? 'income' : 'expense'}
					<kbd class="ft-btn-kbd">↵</kbd>
				</button>
			</div>
		</form>
	</div>
</div>
