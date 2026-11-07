<script lang="ts">
	import type { Snippet } from 'svelte';
	import { XIcon } from '#lib/icons/outline/index.ts';

	interface Props {
		open: boolean;
		title: string;
		onClose: () => void;
		description?: string;
		/** false mientras se procesa una acción: no se cierra con Escape, el fondo ni la X */
		dismissible?: boolean;
		/** Oculta el título en pantalla (sigue siendo el nombre accesible del diálogo) */
		hideTitle?: boolean;
		children: Snippet;
		/** Acciones fijas al pie (no se desplazan con el contenido) */
		footer?: Snippet;
	}

	let {
		open,
		title,
		onClose,
		description,
		dismissible = true,
		hideTitle = false,
		children,
		footer
	}: Props = $props();

	const id = $props.id();
	let dialog = $state<HTMLDialogElement>();

	// <dialog> nativo: foco atrapado, Escape y el resto de la página inerte sin código extra
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	// Sin esto la página de fondo se sigue desplazando al hacer scroll dentro del sheet
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
		if (dismissible) onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		// El contenido ocupa todo el diálogo: un click con target en el <dialog> es en el fondo
		if (event.target === dialog && dismissible) onClose();
	}
</script>

<!--
	Hoja inferior en móvil (al alcance del pulgar) y diálogo centrado desde md.
	Para acciones y detalles de las páginas de clientes.
-->
<dialog
	bind:this={dialog}
	aria-labelledby="{id}-title"
	aria-describedby={description ? `${id}-description` : undefined}
	oncancel={handleCancel}
	onclick={handleBackdropClick}
	class="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden border-0 bg-light-one p-0 text-light-two transition-[translate,opacity] duration-300 ease-out backdrop:bg-light-black/50 backdrop:backdrop-blur-sm motion-reduce:transition-none md:m-auto md:max-h-[85dvh] md:max-w-lg dark:bg-dark-one dark:text-dark-two dark:backdrop:bg-dark-black/50 starting:translate-y-full md:starting:translate-y-4 md:starting:opacity-0"
>
	<div class="flex max-h-[inherit] flex-col">
		<!-- Asa: indica que es una hoja (solo móvil) -->
		<div
			class="mx-auto mt-2.5 h-1.5 w-10 shrink-0 bg-light-one_d md:hidden dark:bg-dark-one_d"
			aria-hidden="true"
		></div>

		<header class="flex shrink-0 items-start gap-3 px-5 pt-3 pb-1 md:px-6 md:pt-6">
			<div class="min-w-0 flex-1">
				<h2
					id="{id}-title"
					class={hideTitle
						? 'sr-only'
						: 'text-lg font-bold text-light-two md:text-xl dark:text-dark-two'}
				>
					{title}
				</h2>
				{#if description}
					<p
						id="{id}-description"
						class={[
							'text-sm text-light-two_d dark:text-dark-two_d',
							hideTitle ? 'sr-only' : 'mt-0.5'
						]}
					>
						{description}
					</p>
				{/if}
			</div>
			{#if dismissible}
				<button
					type="button"
					onclick={onClose}
					aria-label="Cerrar"
					class="-mt-1 -mr-2 inline-flex size-10 shrink-0 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d focus-visible:ring-2 focus-visible:ring-light-three/40 focus-visible:outline-none active:scale-90 dark:text-dark-two_d dark:hover:bg-dark-one_d dark:focus-visible:ring-dark-three/40"
				>
					<XIcon class="size-5" />
				</button>
			{/if}
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-5 md:px-6">
			{@render children()}
		</div>

		{#if footer}
			<footer
				class="shrink-0 border-t border-light-one_d px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6 dark:border-dark-one_d"
			>
				{@render footer()}
			</footer>
		{/if}
	</div>
</dialog>
