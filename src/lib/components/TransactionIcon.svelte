<script lang="ts">
	// Resolves a Lucide icon by the kebab-case name produced by `iconForTag`.
	// Importing the per-icon entry points keeps the bundle to just what we use.
	import Wallet from 'lucide-svelte/icons/wallet';
	import HandCoins from 'lucide-svelte/icons/hand-coins';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Gift from 'lucide-svelte/icons/gift';
	import Banknote from 'lucide-svelte/icons/banknote';
	import House from 'lucide-svelte/icons/house';
	import Utensils from 'lucide-svelte/icons/utensils';
	import Car from 'lucide-svelte/icons/car';
	import Wifi from 'lucide-svelte/icons/wifi';
	import Pill from 'lucide-svelte/icons/pill';
	import Music from 'lucide-svelte/icons/music';
	import ShoppingBag from 'lucide-svelte/icons/shopping-bag';
	import Receipt from 'lucide-svelte/icons/receipt';

	const ICONS: Record<string, typeof Wallet> = {
		wallet: Wallet,
		'hand-coins': HandCoins,
		'trending-up': TrendingUp,
		gift: Gift,
		banknote: Banknote,
		house: House,
		utensils: Utensils,
		car: Car,
		wifi: Wifi,
		pill: Pill,
		music: Music,
		'shopping-bag': ShoppingBag,
		receipt: Receipt
	};

	let {
		name,
		size = 16,
		strokeWidth = 1.6
	}: { name: string; size?: number; strokeWidth?: number } = $props();

	const Cmp = $derived(ICONS[name] ?? Receipt);
</script>

<Cmp {size} {strokeWidth} />
