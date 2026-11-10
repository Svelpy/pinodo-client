<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/index.ts';

	interface Props {
		/** Cantidad de cards/filas a mostrar */
		items?: number;
	}

	let { items = 6 }: Props = $props();

	const WIDTHS = ['w-1/2', 'w-2/3', 'w-2/5', 'w-3/5', 'w-1/3'];
	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
	const block = 'bg-light-one_d dark:bg-dark-one_d';
</script>

<div role="status" aria-label="Cargando ventas">
	<span class="sr-only">Cargando…</span>

	<!-- Móvil: tarjetas (mismo layout que VentaCard) -->
	<div class="grid gap-3 p-3 sm:grid-cols-2 md:hidden" aria-hidden="true">
		{#each { length: items }, i (i)}
			<div
				class="flex animate-pulse gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
			>
				<div class="min-w-0 flex-1 space-y-2">
					<div class={['h-4 w-1/3', block]}></div>
					<div class={['h-3 w-1/2', block]}></div>
					<div class={['h-3.5', block, WIDTHS[i % WIDTHS.length]]}></div>
					<div class={['h-3 w-2/5', block]}></div>
				</div>
				<div class="flex flex-col items-end justify-between">
					<div class={['size-9', block]}></div>
					<div class={['h-5 w-20', block]}></div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Escritorio: tabla (mismas columnas que VentaTable) -->
	<div class="hidden overflow-x-auto md:block" aria-hidden="true">
		<Table class="table-fixed text-sm">
			<TableHeader>
				<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
					<TableHead class="{headClass} w-28">N.º</TableHead>
					<TableHead class="{headClass} w-44">Fecha</TableHead>
					<TableHead class={headClass}>Cliente</TableHead>
					<TableHead class="{headClass} hidden w-32 lg:table-cell">Canal</TableHead>
					<TableHead class="{headClass} hidden w-32 lg:table-cell">Pago</TableHead>
					<TableHead class="{headClass} w-32">Estado</TableHead>
					<TableHead class="{headClass} w-32 text-right">Total</TableHead>
					<TableHead class="h-11 w-14 px-2"><span class="sr-only">Acciones</span></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each { length: items }, i (i)}
					<TableRow
						class="animate-pulse border-light-one_d hover:bg-transparent dark:border-dark-one_d"
					>
						<TableCell class="px-4 py-3"><div class={['h-3.5 w-16', block]}></div></TableCell>
						<TableCell class="px-4 py-3"><div class={['h-3.5 w-28', block]}></div></TableCell>
						<TableCell class="px-4 py-3">
							<div class={['h-3.5', block, WIDTHS[i % WIDTHS.length]]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 lg:table-cell">
							<div class={['h-3.5 w-20', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 lg:table-cell">
							<div class={['h-3.5 w-16', block]}></div>
						</TableCell>
						<TableCell class="px-4 py-3"><div class={['h-5 w-20', block]}></div></TableCell>
						<TableCell class="px-4 py-3">
							<div class={['ml-auto h-3.5 w-20', block]}></div>
						</TableCell>
						<TableCell class="px-2 py-3"><div class={['ml-auto size-9', block]}></div></TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</div>
