<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/index.ts';
	import type { RentabilidadMes } from '#lib/interfaces/index.ts';
	import { formatCurrency, formatMesAnio, formatNumber } from '#lib/utils/index.ts';
	import FinanzasMargen from './finanzasMargen.svelte';

	/** Evolución mes a mes del ingreso, el costo y el margen */
	interface Props {
		/** null = cargando */
		meses: RentabilidadMes[] | null;
	}

	let { meses }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
	const cellClass = 'px-4 py-3 text-right text-sm whitespace-nowrap tabular-nums';
</script>

<section
	aria-label="Rentabilidad por mes"
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	<h3
		class="border-b border-light-one_d px-4 py-2.5 text-sm font-medium text-light-two_d dark:border-dark-one_d dark:text-dark-two_d"
	>
		Por mes
	</h3>

	{#if !meses}
		<div class="space-y-3 px-4 py-3" aria-hidden="true">
			{#each { length: 3 }, i (i)}
				<div class="h-4 w-full animate-pulse bg-light-one_d dark:bg-dark-one_d"></div>
			{/each}
		</div>
	{:else if meses.length === 0}
		<p class="px-4 py-3 text-sm text-light-two_d dark:text-dark-two_d">
			Sin ventas en este periodo.
		</p>
	{:else}
		<div class="relative overflow-x-auto">
			<Table class="text-sm">
				<TableHeader>
					<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
						<TableHead class={headClass}>Mes</TableHead>
						<TableHead class="{headClass} hidden text-right sm:table-cell">Prendas</TableHead>
						<TableHead class="{headClass} text-right">Ingreso</TableHead>
						<TableHead class="{headClass} hidden text-right sm:table-cell">Costo</TableHead>
						<TableHead class="{headClass} text-right">Margen</TableHead>
						<TableHead class="{headClass} text-right">%</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each meses as mes (`${mes.anio}-${mes.mes}`)}
						<TableRow
							class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
						>
							<TableCell
								class="px-4 py-3 text-sm whitespace-nowrap text-light-two capitalize dark:text-dark-two"
							>
								{formatMesAnio(mes.anio, mes.mes)}
							</TableCell>
							<TableCell
								class="{cellClass} hidden text-light-two_d sm:table-cell dark:text-dark-two_d"
							>
								{formatNumber(mes.unidades)}
							</TableCell>
							<TableCell class="{cellClass} text-light-two dark:text-dark-two">
								{formatCurrency(mes.ingreso_neto)}
							</TableCell>
							<TableCell
								class="{cellClass} hidden text-light-two_d sm:table-cell dark:text-dark-two_d"
							>
								{formatCurrency(mes.costo)}
							</TableCell>
							<TableCell class="{cellClass} font-semibold text-light-two dark:text-dark-two">
								{formatCurrency(mes.margen_bruto)}
							</TableCell>
							<TableCell class={cellClass}>
								<FinanzasMargen value={mes.margen_porcentaje} />
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</section>
