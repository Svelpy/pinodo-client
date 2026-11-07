<script lang="ts" generics="T extends string">
	import type { Component, Snippet } from 'svelte';
	import { cn, formatNumber } from '#lib/utils/index.ts';

	interface Props {
		/** Prefijo de los ids de las pestañas y del panel (único en la página) */
		id: string;
		/** Nombre accesible del grupo de pestañas */
		label: string;
		options: { value: T; label: string; icon?: Component }[];
		value: T;
		onChange: (value: T) => void;
		/** Cantidad junto a la pestaña activa (p. ej. total del listado); null = no se muestra */
		count?: number | null;
		/** Controles a la derecha de las pestañas (p. ej. filtros) */
		toolbar?: Snippet;
		/** Contenido de la pestaña activa */
		children: Snippet;
		/** segmented = botones sobre un fondo (panel); underline = ancho completo con línea inferior (app de clientes) */
		variant?: 'segmented' | 'underline';
		class?: string;
	}

	let {
		id,
		label,
		options,
		value,
		onChange,
		count = null,
		toolbar,
		children,
		variant = 'segmented',
		class: className
	}: Props = $props();

	const VARIANTS = {
		segmented: {
			list: 'gap-1  bg-light-one_d p-1 sm:w-fit dark:bg-dark-one_d',
			tab: ' px-3 py-2 font-medium',
			selected: 'bg-light-one text-light-two  dark:bg-dark-one dark:text-dark-two',
			idle: 'text-light-two_d hover:text-light-two dark:text-dark-two_d dark:hover:text-dark-two'
		},
		underline: {
			list: 'border-b border-light-one_d dark:border-dark-one_d',
			// Pestañas del mismo ancho; la activa se marca con una línea inferior (::after)
			tab: 'relative flex-1 justify-center px-3 py-3 font-semibold focus-visible:ring-inset after:absolute after:inset-x-3 after:bottom-0 after:h-0.5  after:transition-colors',
			selected:
				'text-light-three after:bg-light-three dark:text-dark-three dark:after:bg-dark-three',
			idle: 'text-light-two_d after:bg-transparent hover:text-light-two dark:text-dark-two_d dark:hover:text-dark-two'
		}
	} as const;

	const styles = $derived(VARIANTS[variant]);

	const panelId = $derived(`${id}-panel`);
	const tabId = (tab: T) => `${id}-tab-${tab.toLowerCase()}`;

	let tabElements = $state<HTMLButtonElement[]>([]);

	function select(next: T) {
		if (next !== value) onChange(next);
	}

	// Flechas, Inicio y Fin mueven el foco y activan la pestaña (patrón tablist de WAI-ARIA)
	function handleKeydown(event: KeyboardEvent, index: number) {
		const last = options.length - 1;
		const keys: Record<string, number> = {
			ArrowRight: index === last ? 0 : index + 1,
			ArrowLeft: index === 0 ? last : index - 1,
			Home: 0,
			End: last
		};
		const next = keys[event.key];
		if (next === undefined) return;

		event.preventDefault();
		tabElements[next]?.focus();
		select(options[next].value);
	}
</script>

<div class={className}>
	<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
		<div role="tablist" aria-label={label} class={cn('flex overflow-x-auto', styles.list)}>
			{#each options as option, index (option.value)}
				{@const selected = option.value === value}
				<button
					bind:this={tabElements[index]}
					type="button"
					role="tab"
					id={tabId(option.value)}
					aria-selected={selected}
					aria-controls={panelId}
					tabindex={selected ? 0 : -1}
					onclick={() => select(option.value)}
					onkeydown={(event) => handleKeydown(event, index)}
					class={cn(
						'inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none dark:focus-visible:ring-dark-three',
						styles.tab,
						selected ? styles.selected : styles.idle
					)}
				>
					{#if option.icon}
						<option.icon class="size-4" />
					{/if}
					{option.label}
					{#if selected && count !== null}
						<span class=" bg-light-one_d px-1.5 text-xs leading-5 tabular-nums dark:bg-dark-one_d">
							{formatNumber(count)}
						</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if toolbar}
			{@render toolbar()}
		{/if}
	</div>

	<div id={panelId} role="tabpanel" aria-labelledby={tabId(value)}>
		{@render children()}
	</div>
</div>
