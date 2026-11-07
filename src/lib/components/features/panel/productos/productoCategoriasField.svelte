<script lang="ts">
	import { Button } from '#lib/components/ui/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { CategoriaOption } from '#lib/interfaces/index.ts';

	interface Props {
		/** Categorías sin subcategorías de la sección elegida (a ellas se asignan los productos) */
		options: readonly CategoriaOption[];
		selected: string[];
		/** Hay una sección elegida: sin ella no hay categorías que ofrecer ni crear */
		hasSeccion: boolean;
		disabled?: boolean;
		error?: string;
		/** Abre el diálogo para crear una categoría en la sección elegida */
		onCreate?: () => void;
	}

	let {
		options,
		selected = $bindable(),
		hasSeccion,
		disabled = false,
		error,
		onCreate
	}: Props = $props();

	const id = $props.id();
</script>

<div>
	{#if !hasSeccion}
		<p class="text-sm text-light-two_d dark:text-dark-two_d">
			Elige primero una sección para ver sus categorías.
		</p>
	{:else if options.length === 0}
		<!-- Sin categorías disponibles: se invita a crear la primera sin salir del formulario -->
		<div
			class="flex flex-col items-start gap-3 border border-dashed border-light-four p-4 sm:flex-row sm:items-center sm:justify-between dark:border-dark-one_d"
		>
			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				Esta sección aún no tiene categorías donde asignar productos.
			</p>
			{#if onCreate}
				<Button variant="outline" onclick={onCreate} {disabled} class="w-full sm:w-auto">
					{#snippet leftIcon()}<PlusIcon class="size-4" />{/snippet}
					Crear categoría
				</Button>
			{/if}
		</div>
	{:else}
		<p class="mb-2 text-xs text-light-two_d dark:text-dark-two_d">
			Los productos se asignan a categorías sin subcategorías. Puedes elegir varias.
		</p>
		<ul class="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each options as option (option.id)}
				<li>
					<label
						for="{id}-{option.id}"
						class="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-light-two dark:text-dark-two"
					>
						<input
							id="{id}-{option.id}"
							type="checkbox"
							value={option.id}
							bind:group={selected}
							{disabled}
							class="size-4 accent-light-three dark:accent-dark-three"
						/>
						<span class="min-w-0 truncate" title={option.label}>{option.label}</span>
					</label>
				</li>
			{/each}
		</ul>

		{#if onCreate}
			<button
				type="button"
				onclick={onCreate}
				{disabled}
				class="mt-2 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-light-three underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none disabled:opacity-50 dark:text-dark-three"
			>
				<PlusIcon class="size-4" />
				Nueva categoría
			</button>
		{/if}
	{/if}

	{#if error}
		<p class="mt-1 text-sm text-light-error dark:text-dark-error">{error}</p>
	{/if}
</div>
