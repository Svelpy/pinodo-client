<script lang="ts">
	import { tick } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import {
		BrandXIcon,
		CheckIcon,
		CopyIcon,
		FacebookIcon,
		ShareIcon,
		TelegramIcon,
		WhatsappIcon
	} from '#lib/icons/outline/index.ts';
	import { compartirEnlaces, duracion } from '#lib/utils/index.ts';

	interface Props {
		/** URL absoluta que se comparte */
		url: string;
		titulo: string;
		/** Texto que acompaña al enlace (nombre, precio, tienda) */
		texto: string;
		class?: string;
	}

	let { url, titulo, texto, class: className = '' }: Props = $props();

	const id = $props.id();
	let abierto = $state(false);
	let copiado = $state(false);
	let raiz: HTMLElement | undefined = $state();
	let boton: HTMLButtonElement | undefined = $state();
	let menu: HTMLElement | undefined = $state();
	let temporizador: ReturnType<typeof setTimeout> | undefined;

	const redes = $derived.by(() => {
		const enlaces = compartirEnlaces(url, texto);
		return [
			{ nombre: 'WhatsApp', href: enlaces.whatsapp, icon: WhatsappIcon },
			{ nombre: 'Facebook', href: enlaces.facebook, icon: FacebookIcon },
			{ nombre: 'X', href: enlaces.x, icon: BrandXIcon },
			{ nombre: 'Telegram', href: enlaces.telegram, icon: TelegramIcon }
		];
	});

	$effect(() => () => clearTimeout(temporizador));

	// Hoja nativa del sistema (móvil, Safari, Chrome en Windows…); si no existe, menú propio
	async function compartir() {
		if (abierto) return cerrar(true);
		const datos: ShareData = { title: titulo, text: texto, url };
		if (typeof navigator.share === 'function' && (navigator.canShare?.(datos) ?? true)) {
			try {
				await navigator.share(datos);
				return;
			} catch (err) {
				// El usuario cerró la hoja: no se hace nada
				if (err instanceof DOMException && err.name === 'AbortError') return;
			}
		}
		abierto = true;
		await tick();
		menu?.querySelector<HTMLElement>('a, button')?.focus();
	}

	function cerrar(devolverFoco = false) {
		abierto = false;
		if (devolverFoco) boton?.focus();
	}

	async function copiar() {
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			// Sin permiso de portapapeles (o contexto inseguro): se muestra para copiarlo a mano
			window.prompt('Copia el enlace:', url);
			return;
		}
		copiado = true;
		clearTimeout(temporizador);
		temporizador = setTimeout(() => {
			copiado = false;
			cerrar();
		}, 1800);
	}

	function onPointerDown(event: PointerEvent) {
		if (abierto && !raiz?.contains(event.target as Node)) cerrar();
	}

	function onKeydown(event: KeyboardEvent) {
		if (abierto && event.key === 'Escape') {
			event.preventDefault();
			cerrar(true);
		}
	}

	// Tab fuera del menú lo cierra
	function onFocusOut(event: FocusEvent) {
		if (abierto && !raiz?.contains(event.relatedTarget as Node | null)) cerrar();
	}
</script>

<svelte:window onpointerdown={onPointerDown} onkeydown={onKeydown} />

<!-- eslint-disable svelte/no-navigation-without-resolve -- enlaces externos de cada red -->
<div bind:this={raiz} class="relative {className}" onfocusout={onFocusOut}>
	<button
		bind:this={boton}
		type="button"
		onclick={compartir}
		aria-label="Compartir {titulo}"
		aria-haspopup="true"
		aria-expanded={abierto}
		aria-controls={abierto ? `${id}-menu` : undefined}
		title="Compartir"
		class="-m-2 flex size-10 items-center justify-center transition-opacity hover:opacity-60"
	>
		<ShareIcon class="size-5" />
	</button>

	{#if abierto}
		<div
			bind:this={menu}
			id="{id}-menu"
			role="group"
			aria-label="Compartir {titulo}"
			class="absolute top-full right-0 z-20 mt-3 w-60 border border-light-two/15 bg-light-one text-editorial shadow-lg dark:border-dark-two/15 dark:bg-dark-one"
			transition:fly={{ y: -8, duration: duracion(200), easing: cubicOut }}
		>
			<p class="px-4 pt-4 pb-2 text-light-two_d dark:text-dark-two_d">Compartir</p>
			<ul>
				{#each redes as red (red.nombre)}
					<li>
						<a
							href={red.href}
							target="_blank"
							rel="noopener noreferrer"
							onclick={() => cerrar()}
							class="flex items-center gap-3 px-4 py-3 hover:bg-light-one_d focus-visible:bg-light-one_d focus-visible:outline-none dark:hover:bg-dark-one_d dark:focus-visible:bg-dark-one_d"
						>
							<red.icon class="size-5 shrink-0" />
							{red.nombre}
						</a>
					</li>
				{/each}
				<li class="border-t border-light-two/15 dark:border-dark-two/15">
					<button
						type="button"
						onclick={copiar}
						class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-light-one_d focus-visible:bg-light-one_d focus-visible:outline-none dark:hover:bg-dark-one_d dark:focus-visible:bg-dark-one_d"
					>
						{#if copiado}
							<CheckIcon class="size-5 shrink-0" />
						{:else}
							<CopyIcon class="size-5 shrink-0" />
						{/if}
						<span aria-live="polite">{copiado ? 'Enlace copiado' : 'Copiar enlace'}</span>
					</button>
				</li>
			</ul>
		</div>
	{/if}
</div>
