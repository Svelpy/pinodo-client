<script lang="ts">
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { navigating } from '$app/state';
	import { duracion } from '#lib/utils/index.ts';

	// Navegaciones más rápidas que esto (datos ya precargados al pasar el mouse) no muestran barra
	const UMBRAL_MS = 150;

	const progreso = new Tween(0, { easing: cubicOut });
	let visible = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const activo = Boolean(navigating.to);
		untrack(() => {
			clearTimeout(timer);
			if (activo) {
				timer = setTimeout(() => {
					visible = true;
					progreso.set(0, { duration: 0 });
					// Avanza rápido y se frena cerca del final hasta que la navegación termina
					progreso.set(0.85, { duration: duracion(2500) });
				}, UMBRAL_MS);
			} else if (visible) {
				progreso.set(1, { duration: duracion(200) }).then(() => {
					if (!navigating.to) visible = false;
				});
			}
		});
		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-50 h-px"
		role="progressbar"
		aria-label="Cargando página"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(progreso.current * 100)}
		out:fade={{ duration: duracion(300) }}
	>
		<div
			class="h-full origin-left bg-light-two dark:bg-dark-two"
			style:transform="scaleX({progreso.current})"
		></div>
	</div>
{/if}
