<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { KardexAjusteDetalleSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState } from '#lib/components/ui/index.ts';
	import { KardexAjusteDetalle } from '#lib/components/features/panel/kardex/index.ts';
	import { AlertTriangleIcon, ArrowLeftIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import { ErrorCode, type AjusteInventarioDetalle } from '#lib/interfaces/index.ts';
	import { AppError, ajusteInventarioService, errorService } from '#lib/services/index.ts';
	import { formatOrigen } from '#lib/utils/index.ts';

	const ajusteId = $derived(page.params.id ?? '');

	let ajuste = $state<AjusteInventarioDetalle | null>(null);
	let isLoading = $state(true);
	let loadError = $state('');
	let notFound = $state(false);

	const titulo = $derived(
		ajuste ? formatOrigen({ tipo: 'AJUSTE', numero: ajuste.numero }) : 'Ajuste'
	);

	async function load() {
		isLoading = true;
		loadError = '';
		notFound = false;
		try {
			ajuste = await ajusteInventarioService.get(ajusteId);
		} catch (error) {
			if (error instanceof AppError && error.is(ErrorCode.RESOURCE_NOT_FOUND)) notFound = true;
			else loadError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}

	onMount(load);
</script>

<MainLayout title={titulo} noIndex class="container mx-auto space-y-4">
	<div class="flex items-center gap-2">
		<Button
			variant="ghost"
			size="sm"
			href={resolve('/panel/kardex/ajustes')}
			aria-label="Volver a los ajustes"
		>
			{#snippet leftIcon()}<ArrowLeftIcon class="size-4" />{/snippet}
		</Button>
		{#if ajuste}
			<h2 class="text-xl font-bold text-light-two tabular-nums dark:text-dark-two">{titulo}</h2>
		{/if}
	</div>

	{#if isLoading && !ajuste}
		<KardexAjusteDetalleSkeleton />
	{:else if notFound}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No encontramos este ajuste"
			description="Puede que el enlace sea incorrecto."
		>
			<Button variant="outline" size="sm" href={resolve('/panel/kardex/ajustes')}>
				Ver todos los ajustes
			</Button>
		</EmptyState>
	{:else if loadError && !ajuste}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudo cargar el ajuste"
			description={loadError}
		>
			<Button variant="outline" size="sm" onclick={load}>
				{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
				Reintentar
			</Button>
		</EmptyState>
	{:else if ajuste}
		<KardexAjusteDetalle {ajuste} />
	{/if}
</MainLayout>
