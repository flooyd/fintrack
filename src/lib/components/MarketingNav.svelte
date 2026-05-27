<script lang="ts">
	import Logo from './Logo.svelte';
</script>

<header class="ft-nav">
	<div class="ft-nav-inner">
		<Logo href="/" />
		<nav class="ft-nav-right">
			<a class="ft-nav-link" href="/#features">Features</a>
			<a class="ft-nav-link" href="/#how">How it works</a>
			<a class="ft-nav-link" href="/#pricing">Pricing</a>
			<a class="ft-nav-link" href="/login">Log in</a>
			<a class="ft-btn ft-btn-primary ft-btn-sm" href="/login?mode=signup">Get started</a>
		</nav>
	</div>
</header>
