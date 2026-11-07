<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Sheet } from '#lib/components/ui/index.ts';
	import { APP_SITE_CONFIG } from '#lib/constants/index.ts';
	import { DownloadIcon, ShareIcon, SquarePlusIcon } from '#lib/icons/outline/index.ts';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// Android / Chrome / Edge: diálogo nativo del navegador. iOS no lo tiene: se muestran los pasos
	let promptEvent = $state.raw<BeforeInstallPromptEvent | null>(null);
	let isIos = $state(false);
	let showIosSteps = $state(false);

	const visible = $derived(isIos || promptEvent !== null);

	onMount(() => {
		// Ya se abrió como app instalada: no hay nada que ofrecer
		if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) return;

		// iPadOS se presenta como Mac: se distingue por la pantalla táctil
		const ua = navigator.userAgent;
		isIos = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

		promptEvent = window.__installPrompt ?? null;

		const onPrompt = (event: BeforeInstallPromptEvent) => {
			event.preventDefault();
			promptEvent = event;
		};
		const onInstalled = () => {
			promptEvent = null;
			window.__installPrompt = undefined;
		};

		addEventListener('beforeinstallprompt', onPrompt);
		addEventListener('appinstalled', onInstalled);
		return () => {
			removeEventListener('beforeinstallprompt', onPrompt);
			removeEventListener('appinstalled', onInstalled);
		};
	});

	async function install() {
		if (isIos) {
			showIosSteps = true;
			return;
		}
		if (!promptEvent) return;

		const event = promptEvent;
		// El evento sirve una sola vez; si lo rechaza, el navegador puede volver a ofrecerlo más adelante
		promptEvent = null;
		window.__installPrompt = undefined;
		await event.prompt();
	}
</script>

{#if visible}
	<Button variant="ghost" size="md" onclick={install} class={className}>
		{#snippet leftIcon()}
			<DownloadIcon class="size-5" />
		{/snippet}
		Instalar la app
	</Button>
{/if}

<!-- El sheet hereda los estilos de texto de donde se use (p. ej. el hero centrado) -->
<div class="contents text-left">
	<Sheet
		open={showIosSteps}
		title="Instala {APP_SITE_CONFIG.APP_NAME}"
		description="Agrégala a tu pantalla de inicio y ábrela como cualquier app."
		onClose={() => (showIosSteps = false)}
	>
		<ol class="space-y-3">
			<li class="flex items-start gap-3">
				{@render paso(1)}
				<p class="pt-1.5">
					Toca
					<ShareIcon
						class="inline size-5 align-text-bottom text-light-three dark:text-dark-three"
					/>
					<strong class="font-semibold">Compartir</strong> en la barra del navegador.
				</p>
			</li>
			<li class="flex items-start gap-3">
				{@render paso(2)}
				<p class="pt-1.5">
					Desliza y elige
					<SquarePlusIcon
						class="inline size-5 align-text-bottom text-light-three dark:text-dark-three"
					/>
					<strong class="font-semibold">Agregar a inicio</strong>.
				</p>
			</li>
			<li class="flex items-start gap-3">
				{@render paso(3)}
				<p class="pt-1.5">
					Toca <strong class="font-semibold">Agregar</strong>. El ícono aparecerá en tu pantalla de
					inicio.
				</p>
			</li>
		</ol>
		<p class="mt-5 text-sm text-light-two_d dark:text-dark-two_d">
			¿No ves la opción? Abre esta página en Safari.
		</p>

		{#snippet footer()}
			<Button variant="primary" fullWidth onclick={() => (showIosSteps = false)}>Entendido</Button>
		{/snippet}
	</Sheet>
</div>

{#snippet paso(numero: number)}
	<span
		class="flex size-8 shrink-0 items-center justify-center rounded-full bg-light-one_d text-sm font-semibold text-light-three dark:bg-dark-one_d dark:text-dark-three"
	>
		{numero}
	</span>
{/snippet}
