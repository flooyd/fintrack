<script lang="ts">
	import { enhance } from '$app/forms';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Logo from './Logo.svelte';

	let { name, initials }: { name: string; initials: string } = $props();
</script>

<header class="ft-nav">
	<div class="ft-nav-inner">
		<Logo href="/app" />
		<nav class="ft-nav-right">
			<a class="ft-nav-link" href="/">About</a>
			<span class="ft-user">
				<span class="ft-user-avatar" title={name}>{initials}</span>
				<span class="ft-user-name">{name}</span>
			</span>
			<form method="post" action="/app?/signOut" use:enhance>
				<button class="ft-signout" type="submit">
					<LogOut size={14} />
					Sign out
				</button>
			</form>
		</nav>
	</div>
</header>
