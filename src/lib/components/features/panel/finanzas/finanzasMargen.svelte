<script lang="ts">
	import { cn, formatPercent } from '#lib/utils/index.ts';

	/** Margen como porcentaje; en rojo si se vendió por debajo del costo */
	interface Props {
		/** De 0 a 1 */
		value: number;
		class?: string;
	}

	let { value, class: className }: Props = $props();
</script>

<span
	class={cn(
		'tabular-nums',
		value < 0 ? 'text-light-error dark:text-dark-error' : 'text-light-two_d dark:text-dark-two_d',
		className
	)}
>
	{formatPercent(value)}
</span>
