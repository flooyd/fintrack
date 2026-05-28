<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Plus from 'lucide-svelte/icons/plus';
	import Minus from 'lucide-svelte/icons/minus';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';
	import { tagsFor, type Kind } from '$lib/finance';

	let {
		entry,
		onclose,
		onsaved,
		ondeleted
	}: {
		entry: { id: string; kind: Kind; amount: number; tag: string; note: string };
		onclose: () => void;
		onsaved: (entry: { kind: Kind; amount: number; tag: string }) => void;
		ondeleted: () => void;
	} = $props();

	const isIncome = $derived(entry.kind === 'income');
	const tags = $derived(tagsFor(entry.kind));

	let amount = $state(untrack(() => String(entry.amount)));
	let tag = $state(untrack(() => entry.tag));
	let note = $state(untrack(() => entry.note));
	let submitting = $state(false);
	let deleting = $state(false);
	let confirmingDelete = $state(false);
	let error = $state('');

	function onOverlayDown(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ft-drawer-overlay" onmousedown={onOverlayDown}>
	<div
		class="ft-drawer ft-drawer-{entry.kind}"
		role="dialog"
		aria-modal="true"
		aria-label="Edit entry"
	>
		<div class="ft-drawer-head">
			<div class="ft-drawer-title">
				<span class="ft-action-icon ft-action-icon-{entry.kind}" style="width: 32px; height: 32px;">
					{#if isIncome}
						<Plus size={16} strokeWidth={2.4} />
					{:else}
						<Minus size={16} strokeWidth={2.4} />
					{/if}
				</span>
				<span>Edit {isIncome ? 'income' : 'expense'}</span>
			</div>
			<button class="ft-icon-btn" type="button" onclick={onclose} aria-label="Close">
				<X size={16} />
			</button>
		</div>

		<form
			class="ft-drawer-body"
			method="post"
			action="/app?/editTransaction"
			use:enhance={() => {
				submitting = true;
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'success' && result.data?.success) {
						await update();
						onsaved({ kind: entry.kind, amount: Number(amount), tag });
					} else if (result.type === 'failure') {
						error = (result.data?.message as string) ?? 'Could not save changes.';
					}
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="id" value={entry.id} />
			<input type="hidden" name="kind" value={entry.kind} />
			<input type="hidden" name="tag" value={tag} />

			{#if error}<div class="lg-error" style="margin: 0;">{error}</div>{/if}

			<label class="ft-field">
				<span class="ft-field-label">Amount</span>
				<span class="ft-amount-input">
					<span class="ft-amount-prefix">$</span>
					<input type="number" name="amount" step="0.01" min="0.01" bind:value={amount} required />
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

			<div class="ft-drawer-foot ft-drawer-foot-edit">
				<button
					type="button"
					class="ft-btn ft-btn-ghost ft-btn-delete"
					onclick={() => (confirmingDelete = true)}
					disabled={submitting || deleting}
				>
					<Trash2 size={14} />
					Delete
				</button>
				<div class="ft-drawer-foot-right">
					<button type="button" class="ft-btn ft-btn-ghost" onclick={onclose}>Cancel</button>
					<button type="submit" class="ft-btn ft-btn-{entry.kind}" disabled={submitting}>
						Save changes
					</button>
				</div>
			</div>
		</form>

		{#if confirmingDelete}
			<form
				class="ft-delete-confirm"
				method="post"
				action="/app?/deleteTransaction"
				use:enhance={() => {
					deleting = true;
					error = '';
					return async ({ result, update }) => {
						if (result.type === 'success' && result.data?.success) {
							await update();
							ondeleted();
						} else if (result.type === 'failure') {
							error = (result.data?.message as string) ?? 'Could not delete.';
							confirmingDelete = false;
						}
						deleting = false;
					};
				}}
			>
				<input type="hidden" name="id" value={entry.id} />
				<span class="ft-delete-confirm-text">Delete this entry?</span>
				<div class="ft-delete-confirm-buttons">
					<button
						type="button"
						class="ft-btn ft-btn-sm ft-btn-ghost"
						onclick={() => (confirmingDelete = false)}
						disabled={deleting}
					>
						Cancel
					</button>
					<button type="submit" class="ft-btn ft-btn-sm ft-btn-expense" disabled={deleting}>
						Delete
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>
