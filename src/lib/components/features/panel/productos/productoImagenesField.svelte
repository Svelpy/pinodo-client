<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Select } from '#lib/components/ui/index.ts';
	import {
		IMAGEN_LIMITS,
		IMAGEN_TIPO,
		IMAGEN_TIPO_DEFAULT,
		IMAGEN_TIPO_LABEL
	} from '#lib/constants/index.ts';
	import {
		CheckIcon,
		LoaderIcon,
		PhotoIcon,
		RefreshIcon,
		XIcon
	} from '#lib/icons/outline/index.ts';
	import type { ProductoFormImagen } from '#lib/interfaces/index.ts';
	import { errorService, imagenService } from '#lib/services/index.ts';
	import { cn, createKey, validateImagenFile } from '#lib/utils/index.ts';
	import type { ImagenTipo } from '#lib/constants/index.ts';

	interface Props {
		id: string;
		imagenes: ProductoFormImagen[];
		disabled?: boolean;
		/** Error de validación de una imagen del conjunto (p. ej. tipo inválido) */
		error?: string;
	}

	let { id, imagenes = $bindable(), disabled = false, error }: Props = $props();

	const tipos = Object.values(IMAGEN_TIPO);
	const maxMb = IMAGEN_LIMITS.MAX_BYTES / (1024 * 1024);

	let input = $state<HTMLInputElement>();
	let isDragging = $state(false);

	// Las subidas terminan después de que el usuario siga editando: se localiza la imagen por su clave
	function patch(key: string, changes: Partial<ProductoFormImagen>) {
		const target = imagenes.find((imagen) => imagen.key === key);
		if (target) Object.assign(target, changes);
	}

	async function upload(key: string, file: File) {
		patch(key, { status: 'uploading', error: '' });
		try {
			const { url } = await imagenService.upload(file);
			patch(key, { status: 'ready', url });
		} catch (uploadError) {
			patch(key, { status: 'error', error: errorService.getMessage(uploadError) });
		}
	}

	// Cada imagen se sube en cuanto se elige: al guardar el producto solo viaja su url
	function addFiles(files: Iterable<File>) {
		for (const file of files) {
			const message = validateImagenFile(file);
			const imagen: ProductoFormImagen = {
				key: createKey(),
				file,
				preview: URL.createObjectURL(file),
				name: file.name,
				status: message ? 'error' : 'uploading',
				url: '',
				tipo: IMAGEN_TIPO_DEFAULT,
				error: message ?? ''
			};
			imagenes.push(imagen);
			if (!message) upload(imagen.key, file);
		}
	}

	function remove(key: string) {
		const target = imagenes.find((imagen) => imagen.key === key);
		// Las ya guardadas muestran su url remota: no hay URL temporal que liberar
		if (target && !target.existing) URL.revokeObjectURL(target.preview);
		imagenes = imagenes.filter((imagen) => imagen.key !== key);
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		addFiles(Array.from(event.currentTarget.files ?? []));
		// Permite volver a elegir el mismo archivo después de quitarlo
		if (input) input.value = '';
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		if (!disabled) addFiles(Array.from(event.dataTransfer?.files ?? []));
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) isDragging = true;
	}

	onDestroy(() => {
		for (const imagen of imagenes) if (!imagen.existing) URL.revokeObjectURL(imagen.preview);
	});
</script>

<!-- `relative`: el input oculto (sr-only es absoluto) debe quedar dentro de este bloque. Sin un
     ancestro posicionado su referencia sería la página y, al recibir el foco, el navegador
     desplazaría los contenedores overflow-hidden del layout del panel -->
<div class="relative">
	<input
		bind:this={input}
		{id}
		type="file"
		accept="image/*"
		multiple
		{disabled}
		onchange={handleInput}
		class="sr-only"
		aria-describedby="{id}-hint"
		aria-invalid={!!error}
	/>

	<div
		role="presentation"
		ondragover={handleDragOver}
		ondragleave={() => (isDragging = false)}
		ondrop={handleDrop}
		class={cn(
			'border-2 border-dashed p-3 transition-colors',
			isDragging
				? 'border-light-three bg-light-one_d dark:border-dark-three dark:bg-dark-one_d'
				: error
					? 'border-light-error dark:border-dark-error'
					: 'border-light-four dark:border-dark-one_d',
			disabled && 'opacity-60'
		)}
	>
		<div class="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
			<PhotoIcon class="size-8 shrink-0 text-light-four dark:text-dark-four" />
			<p id="{id}-hint" class="flex-1 text-xs text-light-two_d dark:text-dark-two_d">
				Arrastra imágenes aquí o elígelas desde tu dispositivo. Máximo {maxMb} MB por imagen, sin SVG.
				Se suben al elegirlas.
			</p>
			<label
				for={id}
				class={cn(
					'inline-flex min-h-9 cursor-pointer items-center border border-light-four px-3 py-2 text-sm font-medium text-light-two transition-colors hover:bg-light-one_d dark:border-dark-one_d dark:text-dark-two dark:hover:bg-dark-one_d',
					disabled && 'pointer-events-none'
				)}
			>
				Elegir imágenes
			</label>
		</div>

		{#if imagenes.length > 0}
			<ul class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{#each imagenes as imagen (imagen.key)}
					<li
						class="border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
					>
						<div class="relative aspect-square overflow-hidden bg-light-one_d dark:bg-dark-one_d">
							<img src={imagen.preview} alt={imagen.name} class="size-full object-cover" />

							{#if imagen.status === 'uploading'}
								<div
									role="status"
									class="absolute inset-0 flex items-center justify-center bg-light-black/40"
								>
									<LoaderIcon class="size-6 animate-spin text-light-one" />
									<span class="sr-only">Subiendo {imagen.name}…</span>
								</div>
							{:else if imagen.status === 'ready'}
								<span
									class="absolute top-1 left-1 inline-flex size-6 items-center justify-center bg-light-success text-light-one dark:bg-dark-success dark:text-dark-one"
									title="Imagen subida"
								>
									<CheckIcon class="size-4" />
									<span class="sr-only">Imagen subida</span>
								</span>
							{/if}

							<button
								type="button"
								onclick={() => remove(imagen.key)}
								{disabled}
								aria-label="Quitar {imagen.name}"
								class="absolute top-1 right-1 inline-flex size-7 items-center justify-center bg-light-black/60 text-light-one transition-colors hover:bg-light-black focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none"
							>
								<XIcon class="size-4" />
							</button>
						</div>

						<div class="space-y-1.5 p-2">
							<p class="truncate text-xs text-light-two dark:text-dark-two" title={imagen.name}>
								{imagen.name}
							</p>

							{#if imagen.status === 'error'}
								<p role="alert" class="text-xs text-light-error dark:text-dark-error">
									{imagen.error}
								</p>
								{#if imagen.file && !validateImagenFile(imagen.file)}
									<button
										type="button"
										onclick={() => imagen.file && upload(imagen.key, imagen.file)}
										{disabled}
										class="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-light-two underline underline-offset-2 dark:text-dark-two"
									>
										<RefreshIcon class="size-3.5" /> Reintentar
									</button>
								{/if}
							{:else if tipos.length > 1}
								<Select
									id="{id}-{imagen.key}-tipo"
									aria-label="Tipo de {imagen.name}"
									value={imagen.tipo}
									onchange={(event) => (imagen.tipo = event.currentTarget.value as ImagenTipo)}
									{disabled}
								>
									{#each tipos as tipo (tipo)}
										<option value={tipo}>{IMAGEN_TIPO_LABEL[tipo]}</option>
									{/each}
								</Select>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if error}
		<p class="mt-1 text-sm text-light-error dark:text-dark-error">{error}</p>
	{/if}
</div>
