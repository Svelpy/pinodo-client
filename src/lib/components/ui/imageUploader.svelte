<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { PhotoIcon } from '#lib/icons/outline/index.ts';
	import { cn } from '#lib/utils/cn.ts';

	interface Props {
		id: string;
		/** Archivo seleccionado (aún no subido) */
		value?: File | null;
		/** Imagen ya guardada; se muestra mientras no se elija otra */
		currentUrl?: string | null;
		label?: string;
		hint?: string;
		error?: string;
		accept?: string;
		disabled?: boolean;
		class?: string;
		onFileChange?: (file: File | null) => void;
	}

	let {
		id,
		value = $bindable(null),
		currentUrl = null,
		label,
		hint,
		error,
		accept = 'image/*',
		disabled = false,
		class: className,
		onFileChange
	}: Props = $props();

	let input = $state<HTMLInputElement>();
	let isDragging = $state(false);
	let objectUrl = $state<string | null>(null);

	// URL temporal de la vista previa; se libera al cambiar de archivo o desmontar
	$effect(() => {
		if (!value) {
			objectUrl = null;
			return;
		}
		const url = URL.createObjectURL(value);
		objectUrl = url;
		return () => URL.revokeObjectURL(url);
	});

	const previewUrl = $derived(objectUrl ?? currentUrl);

	function setFile(file: File | null) {
		value = file;
		onFileChange?.(file);
		// Permite volver a elegir el mismo archivo después de quitarlo
		if (input) input.value = '';
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		setFile(event.currentTarget.files?.[0] ?? null);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		if (disabled) return;
		const file = event.dataTransfer?.files?.[0];
		if (file) setFile(file);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) isDragging = true;
	}

	function formatSize(bytes: number): string {
		return bytes < 1024 * 1024
			? `${Math.round(bytes / 1024)} KB`
			: `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<!-- `relative`: contiene el input oculto (sr-only es absoluto); ver productoImagenesField -->
<div class={cn('relative', className)}>
	{#if label}
		<p class="mb-1 text-sm leading-6 font-medium text-light-black sm:text-base dark:text-dark-two">
			{label}
		</p>
	{/if}

	<input
		bind:this={input}
		{id}
		type="file"
		{accept}
		{disabled}
		onchange={handleInput}
		class="sr-only"
		aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
		aria-invalid={!!error}
	/>

	<div
		role="presentation"
		ondragover={handleDragOver}
		ondragleave={() => (isDragging = false)}
		ondrop={handleDrop}
		class={cn(
			'flex flex-col items-center gap-4  border-2 border-dashed p-4 transition-colors sm:flex-row',
			isDragging
				? 'border-light-three bg-light-one_d dark:border-dark-three dark:bg-dark-one_d'
				: error
					? 'border-light-error'
					: 'border-light-four dark:border-dark-one_d',
			disabled && 'opacity-60'
		)}
	>
		<div
			class="flex size-28 shrink-0 items-center justify-center overflow-hidden bg-light-one_d text-light-four dark:bg-dark-one_d dark:text-dark-four"
		>
			{#if previewUrl}
				<img src={previewUrl} alt="Vista previa" class="size-full object-cover" />
			{:else}
				<PhotoIcon class="size-10" />
			{/if}
		</div>

		<div class="min-w-0 flex-1 text-center sm:text-left">
			{#if value}
				<p class="truncate text-sm font-medium text-light-two dark:text-dark-two">{value.name}</p>
				<p class="text-xs text-light-two_d dark:text-dark-four">
					{formatSize(value.size)} · Nueva imagen sin guardar
				</p>
			{:else if currentUrl}
				<p class="text-sm font-medium text-light-two dark:text-dark-two">Imagen actual</p>
			{:else}
				<p class="text-sm font-medium text-light-two dark:text-dark-two">
					Arrastra una imagen aquí
				</p>
				<p class="text-xs text-light-two_d dark:text-dark-four">o elígela desde tu dispositivo</p>
			{/if}

			{#if hint}
				<p id="{id}-hint" class="mt-1 text-xs text-light-two_d dark:text-dark-four">{hint}</p>
			{/if}

			<div class="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
				<label
					for={id}
					class={cn(
						'inline-flex min-h-9 cursor-pointer items-center  border border-light-four px-3 py-2 text-sm font-medium text-light-two transition-colors hover:bg-light-one_d dark:border-dark-one_d dark:text-dark-two dark:hover:bg-dark-one_d',
						disabled && 'pointer-events-none'
					)}
				>
					{previewUrl ? 'Cambiar imagen' : 'Elegir imagen'}
				</label>
				{#if value}
					<button
						type="button"
						onclick={() => setFile(null)}
						{disabled}
						class="inline-flex min-h-9 items-center px-3 py-2 text-sm font-medium text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-two dark:text-dark-four dark:hover:bg-dark-one_d"
					>
						Quitar
					</button>
				{/if}
			</div>
		</div>
	</div>

	{#if error}
		<p
			id="{id}-error"
			transition:slide={{ duration: 300, easing: cubicOut }}
			class="mt-1 text-sm text-red-500"
		>
			{error}
		</p>
	{/if}
</div>
