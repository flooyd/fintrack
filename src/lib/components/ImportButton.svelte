<script lang="ts">
	import { enhance } from '$app/forms';
	import Upload from 'lucide-svelte/icons/upload';

	let {
		onimport
	}: {
		onimport: (result: {
			imported: number;
			duplicates?: number;
			scanned?: number;
			message?: string;
		}) => void;
	} = $props();

	let formEl = $state<HTMLFormElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let submitting = $state(false);

	function pickFile() {
		fileInput?.click();
	}

	function onFileChosen() {
		if (fileInput?.files?.length) {
			formEl?.requestSubmit();
		}
	}
</script>

<form
	bind:this={formEl}
	method="post"
	action="/app?/importCashAppCsv"
	enctype="multipart/form-data"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.success) {
				await update();
				onimport({
					imported: Number(result.data.imported ?? 0),
					duplicates: Number(result.data.duplicates ?? 0),
					scanned: Number(result.data.scanned ?? 0),
					message: result.data.message as string | undefined
				});
			} else if (result.type === 'failure') {
				onimport({
					imported: 0,
					message: (result.data?.message as string) ?? 'Import failed.'
				});
			}
			submitting = false;
			if (fileInput) fileInput.value = '';
		};
	}}
>
	<input
		bind:this={fileInput}
		type="file"
		name="file"
		accept=".csv,text/csv"
		onchange={onFileChosen}
		hidden
	/>
	<button
		type="button"
		class="ft-import-btn"
		onclick={pickFile}
		disabled={submitting}
		aria-label="Import Cash App CSV"
	>
		<Upload size={12} strokeWidth={2.2} />
		{submitting ? 'Importing…' : 'Import CSV'}
	</button>
</form>
