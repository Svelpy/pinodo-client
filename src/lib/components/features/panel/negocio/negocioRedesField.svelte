<script lang="ts">
	import { AlertBox, EmptyState } from '#lib/components/ui/index.ts';
	import { REDES_SOCIALES_SUGERIDAS } from '#lib/constants/index.ts';
	import { ShareIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { RedSocialForm } from '#lib/interfaces/index.ts';
	import { cn } from '#lib/utils/index.ts';
	import { TIENDA_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		value: RedSocialForm[];
		/** Errores con la ruta completa (`redes_sociales.1.url`) o de todas las redes (`redes_sociales`) */
		errors: Record<string, string>;
		disabled?: boolean;
	}

	let { value = $bindable(), errors, disabled = false }: Props = $props();

	const id = $props.id();

	const inputClass =
		'h-10 w-full min-w-0 border border-light-four bg-light-one px-3 text-sm text-light-black transition-colors outline-none placeholder:text-xs hover:border-light-two focus:border-light-three disabled:opacity-50 sm:text-base placeholder:sm:text-sm';
</script>

<div class="space-y-3">
	{#if errors.redes_sociales}
		<AlertBox>{errors.redes_sociales}</AlertBox>
	{/if}

	{#if value.length === 0}
		<EmptyState
			icon={ShareIcon}
			title="Sin redes sociales"
			description="Añade los enlaces a tus perfiles para mostrarlos en la tienda."
			class="py-6"
		/>
	{:else}
		<!-- Una sola lista de sugerencias para todas las filas -->
		<datalist id="{id}-sugeridas">
			{#each REDES_SOCIALES_SUGERIDAS as red (red)}
				<option value={red}></option>
			{/each}
		</datalist>

		<ul class="space-y-3">
			{#each value as item, index (index)}
				{@const redError = errors[`redes_sociales.${index}.red`]}
				{@const urlError = errors[`redes_sociales.${index}.url`]}
				<li>
					<div class="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[12rem_1fr_auto]">
						<input
							type="text"
							bind:value={item.red}
							list="{id}-sugeridas"
							{disabled}
							maxlength={TIENDA_LIMITS.RED_MAX}
							placeholder="Red (p. ej. instagram)"
							autocomplete="off"
							autocapitalize="none"
							aria-label="Red social {index + 1}"
							aria-invalid={!!redError}
							aria-describedby={redError || urlError ? `${id}-${index}-error` : undefined}
							class={cn(inputClass, redError && 'border-light-error')}
						/>
						<input
							type="url"
							inputmode="url"
							bind:value={item.url}
							{disabled}
							placeholder="https://…"
							autocomplete="off"
							aria-label="Enlace de la red social {index + 1}"
							aria-invalid={!!urlError}
							aria-describedby={redError || urlError ? `${id}-${index}-error` : undefined}
							class={cn(
								inputClass,
								'col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto',
								urlError && 'border-light-error'
							)}
						/>
						<button
							type="button"
							onclick={() => value.splice(index, 1)}
							{disabled}
							aria-label="Quitar {item.red || 'red social'}"
							class="col-start-2 row-start-1 inline-flex size-10 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-error disabled:opacity-50 sm:col-start-3 dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-error"
						>
							<TrashIcon class="size-5" />
						</button>
					</div>
					{#if redError || urlError}
						<p
							id="{id}-{index}-error"
							class="mt-1 text-sm text-light-error dark:text-dark-error"
							role="alert"
						>
							{redError ?? urlError}
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
