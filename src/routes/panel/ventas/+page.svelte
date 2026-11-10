<script lang="ts">
	import { resolve } from '$app/paths';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { Button, EmptyState } from '#lib/components/ui/index.ts';
	import { VentaCaja } from '#lib/components/features/panel/ventas/index.ts';
	import { LockIcon } from '#lib/icons/outline/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { puedeRegistrarVenta } from '#lib/utils/index.ts';

	const puedeVender = $derived(puedeRegistrarVenta($currentRole));
</script>

<MainLayout title="Nueva venta" noIndex class="mx-auto max-w-screen-2xl">
	{#if puedeVender}
		<VentaCaja />
	{:else}
		<div class="border border-light-one_d dark:border-dark-one_d">
			<EmptyState
				icon={LockIcon}
				title="Tu rol no puede registrar ventas"
				description="Puedes consultar las ventas y pedidos registrados en el historial."
			>
				<Button variant="outline" href={resolve('/panel/ventas/historial')}>
					Ver historial de ventas
				</Button>
			</EmptyState>
		</div>
	{/if}
</MainLayout>
