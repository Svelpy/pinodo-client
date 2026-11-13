<script lang="ts">
	import { resolve } from '$app/paths';
	import { ListIcon } from '#lib/icons/outline/index.ts';

	/** Enlace al kardex de un SKU (`/panel/kardex?sku=…`) */
	interface Props {
		skuId: string;
		/** Para el nombre accesible, p. ej. "Camisa Oxford, Azul marino · M" */
		nombre: string;
		class?: string;
	}

	let { skuId, nombre, class: className }: Props = $props();

	const href = $derived(`${resolve('/panel/kardex')}?${new URLSearchParams({ sku: skuId })}`);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- resolve() en el href, más la query -->
<a
	{href}
	aria-label="Ver el kardex de {nombre}"
	title="Ver kardex"
	class={[
		'inline-flex size-9 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-two focus-visible:ring-2 focus-visible:ring-light-three/40 focus-visible:outline-none dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-two dark:focus-visible:ring-dark-three/40',
		className
	]}
>
	<ListIcon class="size-5" />
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
