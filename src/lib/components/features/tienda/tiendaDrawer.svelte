<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import { duracion } from '#lib/utils/index.ts';

	interface Props {
		open: boolean;
		title: string;
		onClose: () => void;
		/** Lado desde el que entra: el menú a la izquierda, la cesta a la derecha */
		side?: 'left' | 'right';
		children: Snippet;
		/** Acciones fijas al pie */
		footer?: Snippet;
	}

	let { open, title, onClose, side = 'right', children, footer }: Props = $props();

	const id = $props.id();
	let dialog = $state<HTMLDialogElement>();
	let fondo = $state<HTMLDivElement>();

	const desde = $derived(side === 'right' ? '100%' : '-100%');

	// <dialog> nativo (foco atrapado, Escape, página inerte). Se abre al instante; se cierra cuando
	// termina la transición de salida del panel (o enseguida si no hay animación)
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open && duracion(1) === 0) dialog.close();
	});

	$effect(() => {
		if (!open) return;
		const { overflow } = document.documentElement.style;
		document.documentElement.style.overflow = 'hidden';
		return () => {
			document.documentElement.style.overflow = overflow;
		};
	});

	function handleCancel(event: Event) {
		// El cierre siempre lo decide el padre a través de `open`
		event.preventDefault();
		onClose();
	}

	function handleClick(event: MouseEvent) {
		if (event.target === fondo) onClose();
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="{id}-title"
	oncancel={handleCancel}
	onclick={handleClick}
	class="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-light-two backdrop:bg-transparent dark:text-dark-two"
>
	{#if open}
		<div
			bind:this={fondo}
			class="absolute inset-0 bg-light-black/30"
			transition:fade={{ duration: duracion(250) }}
		></div>

		<div
			class={[
				'absolute inset-y-0 flex w-full max-w-md flex-col bg-light-one shadow-2xl shadow-light-black/10 dark:bg-dark-one',
				side === 'right' ? 'right-0' : 'left-0'
			]}
			in:fly={{ x: desde, opacity: 1, duration: duracion(380), easing: cubicOut }}
			out:fly={{ x: desde, opacity: 1, duration: duracion(260), easing: cubicIn }}
			onoutroend={() => dialog?.close()}
		>
			<header class="flex shrink-0 items-center justify-between px-6 pt-6 pb-4">
				<h2 id="{id}-title" class="text-editorial">{title}</h2>
				<button
					type="button"
					onclick={onClose}
					class="-mr-2 px-2 py-1 text-editorial underline-offset-4 hover:underline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-current"
				>
					Cerrar
				</button>
			</header>

			<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
				{@render children()}
			</div>

			{#if footer}
				<footer
					class="shrink-0 border-t border-light-two/15 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:border-dark-two/15"
				>
					{@render footer()}
				</footer>
			{/if}
		</div>
	{/if}
</dialog>
