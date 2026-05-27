<script lang="ts">
	// Self-hosted fonts (Fontsource) — Bricolage Grotesque for display headings,
	// Geist for body/UI (incl. its true italic for the hero accent), Geist Mono
	// for keyboard hints and system numerals.
	import '@fontsource-variable/bricolage-grotesque';
	import '@fontsource-variable/geist';
	import '@fontsource-variable/geist/wght-italic.css';
	import '@fontsource-variable/geist-mono';
	import '../app.css';

	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
