<script lang="ts">
	import { AlertBox } from '#lib/components/ui/index.ts';
	import { DIA_SEMANA_LABEL } from '#lib/constants/index.ts';
	import type { DiaSemana } from '#lib/constants/index.ts';
	import type { HorarioDiaForm } from '#lib/interfaces/index.ts';
	import { cn } from '#lib/utils/index.ts';

	interface Props {
		/** Los 7 días, de lunes a domingo */
		value: HorarioDiaForm[];
		/** Errores con la ruta completa (`horario.0.cierre`) o de todo el horario (`horario`) */
		errors: Record<string, string>;
		disabled?: boolean;
	}

	let { value = $bindable(), errors, disabled = false }: Props = $props();

	const id = $props.id();

	const abiertos = $derived(value.filter((dia) => dia.abierto));
	const modelo = $derived(abiertos[0]);

	// Copia las horas del primer día abierto a los demás días abiertos
	function copiarATodos() {
		if (!modelo) return;
		for (const dia of value) {
			if (dia.abierto) {
				dia.apertura = modelo.apertura;
				dia.cierre = modelo.cierre;
			}
		}
	}

	const label = (dia: string) => DIA_SEMANA_LABEL[dia as DiaSemana] ?? dia;

	const timeClass =
		'h-10 w-full min-w-0 border border-light-four bg-light-one px-3 text-sm text-light-black transition-colors outline-none hover:border-light-two focus:border-light-three disabled:opacity-50 sm:w-32 sm:text-base';
</script>

<div class="space-y-3">
	{#if errors.horario}
		<AlertBox>{errors.horario}</AlertBox>
	{/if}

	{#if abiertos.length === 0}
		<p class="text-sm text-light-two_d dark:text-dark-two_d">
			Sin días abiertos: la tienda no mostrará horario.
		</p>
	{/if}

	<ul class="divide-y divide-light-one_d dark:divide-dark-one_d">
		{#each value as dia, index (dia.dia)}
			{@const aperturaError = errors[`horario.${index}.apertura`]}
			{@const cierreError = errors[`horario.${index}.cierre`]}
			<li
				class="grid grid-cols-1 gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center"
			>
				<label class="flex min-h-9 cursor-pointer items-center gap-3 text-sm font-medium">
					<input
						type="checkbox"
						bind:checked={dia.abierto}
						{disabled}
						class="size-4 accent-light-three dark:accent-dark-three"
					/>
					<span class="text-light-two dark:text-dark-two">{label(dia.dia)}</span>
				</label>

				{#if dia.abierto}
					<div>
						<div class="flex items-center gap-2">
							<input
								id="{id}-{index}-apertura"
								type="time"
								bind:value={dia.apertura}
								{disabled}
								aria-label="Apertura del {label(dia.dia).toLowerCase()}"
								aria-invalid={!!aperturaError}
								aria-describedby={aperturaError || cierreError ? `${id}-${index}-error` : undefined}
								class={cn(timeClass, aperturaError && 'border-light-error')}
							/>
							<span class="text-sm text-light-two_d dark:text-dark-two_d" aria-hidden="true">a</span
							>
							<input
								id="{id}-{index}-cierre"
								type="time"
								bind:value={dia.cierre}
								{disabled}
								aria-label="Cierre del {label(dia.dia).toLowerCase()}"
								aria-invalid={!!cierreError}
								aria-describedby={aperturaError || cierreError ? `${id}-${index}-error` : undefined}
								class={cn(timeClass, cierreError && 'border-light-error')}
							/>
						</div>
						{#if aperturaError || cierreError}
							<p
								id="{id}-{index}-error"
								class="mt-1 text-sm text-light-error dark:text-dark-error"
								role="alert"
							>
								{aperturaError ?? cierreError}
							</p>
						{/if}
					</div>
				{:else}
					<p class="text-sm text-light-two_d sm:min-h-10 sm:content-center dark:text-dark-two_d">
						Cerrado
					</p>
				{/if}
			</li>
		{/each}
	</ul>

	{#if modelo && abiertos.length > 1}
		<button
			type="button"
			onclick={copiarATodos}
			{disabled}
			class="inline-flex min-h-9 items-center text-sm font-medium text-light-three underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none disabled:opacity-50 dark:text-dark-three"
		>
			Usar el horario del {label(modelo.dia).toLowerCase()} en todos los días abiertos
		</button>
	{/if}
</div>
