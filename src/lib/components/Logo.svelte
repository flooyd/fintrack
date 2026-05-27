<script lang="ts">
	// The finTrack logomark: a polyline climbing up-and-to-the-right with a dot
	// at the peak, sitting in a soft sage tile. Wordmark is optional.
	let {
		href = '/',
		word = true,
		interactive = true
	}: { href?: string; word?: boolean; interactive?: boolean } = $props();
</script>

{#snippet mark()}
	<span class="ft-brand-mark">
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M4 18 L9 12 L13 16 L20 6"
				stroke="#5e7c52"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<circle cx="20" cy="6" r="1.8" fill="#5e7c52" />
		</svg>
	</span>
	{#if word}<span class="ft-brand-word">finTrack</span>{/if}
{/snippet}

{#if interactive}
	<a class="ft-brand" {href} aria-label="finTrack home">{@render mark()}</a>
{:else}
	<span class="ft-brand">{@render mark()}</span>
{/if}
