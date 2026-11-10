<script lang="ts">
	import { ImageUploader } from '#lib/components/ui/index.ts';
	import type { TiendaImagenForm } from '#lib/interfaces/index.ts';
	import { validateImagenFile } from '#lib/utils/index.ts';

	interface Props {
		id: string;
		label: string;
		hint?: string;
		/** Imagen guardada en la tienda */
		currentUrl: string | null;
		value: TiendaImagenForm;
		/** Error de la API para este campo */
		error?: string;
		disabled?: boolean;
	}

	let {
		id,
		label,
		hint,
		currentUrl,
		value = $bindable(),
		error,
		disabled = false
	}: Props = $props();

	// Tipo o tamaño no admitidos: se avisa al elegir el archivo; el formulario no lo envía
	const fileError = $derived(value.file ? validateImagenFile(value.file) : null);
</script>

<div>
	<ImageUploader
		{id}
		{label}
		{hint}
		bind:value={value.file}
		currentUrl={value.eliminar ? null : currentUrl}
		error={fileError ?? error}
		{disabled}
		onFileChange={() => (value.eliminar = false)}
	/>

	{#if currentUrl && !value.file}
		<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
			{#if value.eliminar}
				<p class="text-sm text-light-two_d dark:text-dark-two_d" role="status">
					La imagen actual se quitará al guardar.
				</p>
				<button
					type="button"
					{disabled}
					onclick={() => (value.eliminar = false)}
					class="inline-flex min-h-9 items-center text-sm font-medium text-light-three underline-offset-2 hover:underline disabled:opacity-50 dark:text-dark-three"
				>
					Deshacer
				</button>
			{:else}
				<button
					type="button"
					{disabled}
					onclick={() => (value.eliminar = true)}
					class="inline-flex min-h-9 items-center text-sm font-medium text-light-error underline-offset-2 hover:underline disabled:opacity-50 dark:text-dark-error"
				>
					Quitar imagen actual
				</button>
			{/if}
		</div>
	{/if}
</div>
