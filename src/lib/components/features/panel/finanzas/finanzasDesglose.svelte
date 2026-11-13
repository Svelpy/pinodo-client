<script lang="ts">
	import { formatCurrency } from '#lib/utils/index.ts';

	/**
	 * Cómo se llega de un monto a otro, línea por línea (p. ej. del precio normal al total vendido).
	 * Las restas se muestran con "−"; la última línea es el resultado.
	 */
	interface Props {
		title: string;
		lineas: readonly { label: string; monto: number; resta?: boolean }[];
		total: { label: string; monto: number };
		/** Sin datos todavía: los montos se muestran como "—" */
		cargando?: boolean;
	}

	let { title, lineas, total, cargando = false }: Props = $props();

	const valor = (monto: number, resta = false) =>
		cargando ? '—' : `${resta && monto !== 0 ? '− ' : ''}${formatCurrency(monto)}`;
</script>

<section
	aria-label={title}
	class="border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	<h3
		class="border-b border-light-one_d px-4 py-2.5 text-sm font-medium text-light-two_d dark:border-dark-one_d dark:text-dark-two_d"
	>
		{title}
	</h3>
	<dl class="space-y-2 px-4 py-3 text-sm">
		{#each lineas as linea (linea.label)}
			<div class="flex items-baseline justify-between gap-3">
				<dt class="text-light-two_d dark:text-dark-two_d">{linea.label}</dt>
				<dd class="text-light-two tabular-nums dark:text-dark-two">
					{valor(linea.monto, linea.resta)}
				</dd>
			</div>
		{/each}
		<div
			class="flex items-baseline justify-between gap-3 border-t border-light-one_d pt-2 dark:border-dark-one_d"
		>
			<dt class="font-semibold text-light-two dark:text-dark-two">{total.label}</dt>
			<dd class="font-semibold text-light-two tabular-nums dark:text-dark-two">
				{valor(total.monto)}
			</dd>
		</div>
	</dl>
</section>
