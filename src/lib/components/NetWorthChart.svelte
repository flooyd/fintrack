<script lang="ts">
	import { formatWhole } from '$lib/finance';

	type Point = { label: string; value: number };

	// Sign-aware money formatters so negative net worth reads "−$1k" / "−$1,060"
	// rather than "$-1k" / "$-1,060".
	const kLabel = (v: number) => `${v < 0 ? '−' : ''}$${Math.abs(v / 1000).toFixed(0)}k`;
	const tipValue = (v: number) => `${v < 0 ? '−' : ''}$${formatWhole(Math.abs(v))}`;

	let {
		data,
		width = 760,
		height = 240,
		accent = '#5e7c52',
		muted = '#a1a1aa',
		gradientId = 'ftArea'
	}: {
		data: Point[];
		width?: number;
		height?: number;
		accent?: string;
		muted?: string;
		gradientId?: string;
	} = $props();

	let hoverIdx = $state<number | null>(null);
	let svgEl = $state<SVGSVGElement | null>(null);

	const padX = 12;
	const padTop = 16;
	const padBottom = 26;

	// All scales + paths derive from the data + dimensions. A smooth line is
	// drawn with Catmull-Rom control points converted to cubic Béziers.
	const geom = $derived.by(() => {
		const innerW = width - padX * 2;
		const innerH = height - padTop - padBottom;
		const n = data.length;
		const values = data.map((d) => d.value);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min || 1;
		const yMin = min - range * 0.1;
		const yMax = max + range * 0.05;
		const yRange = yMax - yMin || 1;

		const xAt = (i: number) => padX + (n <= 1 ? 0.5 : i / (n - 1)) * innerW;
		const yAt = (v: number) => padTop + innerH - ((v - yMin) / yRange) * innerH;

		const pts = data.map((d, i) => [xAt(i), yAt(d.value)] as const);

		let linePath = '';
		if (pts.length === 1) {
			linePath = `M ${padX} ${pts[0][1]} L ${width - padX} ${pts[0][1]}`;
		} else if (pts.length >= 2) {
			linePath = `M ${pts[0][0]} ${pts[0][1]}`;
			for (let i = 0; i < pts.length - 1; i++) {
				const p0 = pts[i === 0 ? i : i - 1];
				const p1 = pts[i];
				const p2 = pts[i + 1];
				const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
				const t = 0.18;
				const c1x = p1[0] + (p2[0] - p0[0]) * t;
				const c1y = p1[1] + (p2[1] - p0[1]) * t;
				const c2x = p2[0] - (p3[0] - p1[0]) * t;
				const c2y = p2[1] - (p3[1] - p1[1]) * t;
				linePath += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
			}
		}

		const areaPath =
			pts.length >= 2
				? `${linePath} L ${xAt(n - 1)} ${padTop + innerH} L ${xAt(0)} ${padTop + innerH} Z`
				: '';

		const ticks = [] as { value: number; y: number }[];
		for (let i = 0; i <= 3; i++) {
			const v = yMin + (yRange * i) / 3;
			ticks.push({ value: v, y: yAt(v) });
		}

		return { innerW, innerH, xAt, yAt, linePath, areaPath, ticks };
	});

	const hover = $derived(hoverIdx != null ? data[hoverIdx] : null);
	const hoverX = $derived(hoverIdx != null ? geom.xAt(hoverIdx) : 0);
	const hoverY = $derived(hover ? geom.yAt(hover.value) : 0);

	function handleMove(e: MouseEvent) {
		if (!svgEl || data.length < 2) return;
		const rect = svgEl.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * width;
		const idx = Math.round(((x - padX) / geom.innerW) * (data.length - 1));
		hoverIdx = Math.max(0, Math.min(data.length - 1, idx));
	}
</script>

<div class="ft-chart" style="position: relative; width: 100%;">
	<svg
		bind:this={svgEl}
		viewBox="0 0 {width} {height}"
		width="100%"
		{height}
		role="img"
		aria-label="Net worth over time"
		style="display: block; overflow: visible;"
		onmousemove={handleMove}
		onmouseleave={() => (hoverIdx = null)}
	>
		<defs>
			<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={accent} stop-opacity="0.22" />
				<stop offset="100%" stop-color={accent} stop-opacity="0" />
			</linearGradient>
		</defs>

		{#each geom.ticks as t, i (i)}
			<line
				x1={padX}
				x2={width - padX}
				y1={t.y}
				y2={t.y}
				stroke="#e7e5e0"
				stroke-width="1"
				stroke-dasharray={i === 0 ? '0' : '2 4'}
			/>
			<text
				x={width - padX}
				y={t.y - 4}
				text-anchor="end"
				font-size="11"
				fill={muted}
				style="font-variant-numeric: tabular-nums;"
			>
				{kLabel(t.value)}
			</text>
		{/each}

		{#if geom.areaPath}
			<path d={geom.areaPath} fill="url(#{gradientId})" />
		{/if}
		<path
			d={geom.linePath}
			fill="none"
			stroke={accent}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		{#each data as d, i (d.label + i)}
			{#if i % 2 === 0 || i === data.length - 1}
				<text x={geom.xAt(i)} y={height - 6} text-anchor="middle" font-size="11" fill={muted}>
					{d.label}
				</text>
			{/if}
		{/each}

		{#if hover}
			<g pointer-events="none">
				<line
					x1={hoverX}
					x2={hoverX}
					y1={padTop}
					y2={padTop + geom.innerH}
					stroke={accent}
					stroke-width="1"
					stroke-dasharray="3 3"
					opacity="0.5"
				/>
				<circle cx={hoverX} cy={hoverY} r="5" fill="#fff" stroke={accent} stroke-width="2" />
			</g>
		{/if}
	</svg>

	{#if hover}
		<div
			class="ft-chart-tip"
			style="left: {(hoverX / width) * 100}%; top: 0; transform: translate(-50%, -100%);"
		>
			<div class="ft-chart-tip-label">{hover.label}</div>
			<div class="ft-chart-tip-value">{tipValue(hover.value)}</div>
		</div>
	{/if}
</div>

<style>
	.ft-chart-tip {
		position: absolute;
		background: #18181b;
		color: #fafaf7;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
		margin-top: -8px;
		z-index: 2;
	}
	.ft-chart-tip-label {
		opacity: 0.7;
		font-size: 11px;
		margin-bottom: 2px;
	}
	.ft-chart-tip-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
