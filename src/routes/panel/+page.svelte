<script lang="ts">
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { InicioAtajos, InicioModulos } from '#lib/components/features/panel/inicio/index.ts';
	import { PANEL_NAVIGATION } from '#lib/config/navigation.config.ts';
	import { currentRole, currentUserStore } from '#lib/stores/index.ts';
	import { filterNavigation, formatDateLong } from '#lib/utils/index.ts';

	const sections = $derived(filterNavigation(PANEL_NAVIGATION, $currentRole));
	const nombre = $derived($currentUserStore?.nombre.split(' ')[0] ?? '');
	// Fecha local (toISOString daría el día UTC, que de noche ya es mañana)
	const hoy = new Date().toLocaleDateString('en-CA');

	function saludo(): string {
		const hora = new Date().getHours();
		if (hora < 12) return 'Buenos días';
		if (hora < 19) return 'Buenas tardes';
		return 'Buenas noches';
	}
</script>

<MainLayout title="Inicio" noIndex class="container mx-auto space-y-8">
	<div class="space-y-1">
		<p class="text-xs text-light-two_d capitalize dark:text-dark-two_d">
			{formatDateLong(hoy)}
		</p>
		<h2 class="text-2xl font-semibold text-light-two dark:text-dark-two">
			{saludo()}{nombre ? `, ${nombre}` : ''}
		</h2>
	</div>

	<InicioAtajos role={$currentRole} />
	<InicioModulos {sections} />
</MainLayout>
