<script lang="ts">
	import { formatSignedNumber } from '#lib/utils/index.ts';

	interface Props {
		/** Positivo entra, negativo sale */
		cantidad: number;
		class?: string;
	}

	let { cantidad, class: className }: Props = $props();

	// El verde de la paleta no llega a 4.5:1 sobre blanco: se oscurece como en Badge
	const color = $derived(
		cantidad > 0
			? 'text-[color-mix(in_oklab,var(--color-light-success)_75%,black)] dark:text-dark-success'
			: cantidad < 0
				? 'text-light-error dark:text-dark-error'
				: 'text-light-two_d dark:text-dark-two_d'
	);
	const label = $derived(
		cantidad > 0 ? `Entrada de ${cantidad}` : cantidad < 0 ? `Salida de ${-cantidad}` : 'Sin cambio'
	);
</script>

<span class={['font-semibold tabular-nums', color, className]} aria-label={label}>
	{formatSignedNumber(cantidad)}
</span>
