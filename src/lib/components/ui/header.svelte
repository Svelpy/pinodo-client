<script lang="ts">
	import type { Component } from 'svelte';
	import { asset } from '$app/paths';
	import { Menu2Icon } from '#lib/icons/outline/index.ts';

	interface Props {
		/** Título de la sección actual */
		title: string;
		/** Icono de la sección, junto al título en escritorio (en móvil va el logo) */
		icon?: Component<{ class?: string }>;
		/** Estado del sidebar en móvil, para aria-expanded del botón de menú */
		sidebarOpen: boolean;
		/** id del sidebar que controla el botón de menú */
		sidebarId: string;
		onToggleSidebar: () => void;
	}

	let { title, icon: Icon, sidebarOpen, sidebarId, onToggleSidebar }: Props = $props();
</script>

<header
	class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 bg-light-one px-4 backdrop-blur md:px-6 lg:px-8 dark:border-dark-one_d dark:bg-dark-one_d/85"
>
	<button
		type="button"
		onclick={onToggleSidebar}
		aria-controls={sidebarId}
		aria-expanded={sidebarOpen}
		aria-label="Abrir menú"
		class="-ml-1.5 p-1.5 text-light-two transition-colors hover:bg-light-one_d lg:hidden dark:text-dark-two dark:hover:bg-dark-one_d"
	>
		<Menu2Icon class="size-6" />
	</button>

	<img
		src={asset('images/logo_mark.webp')}
		alt=""
		width="32"
		height="32"
		class="size-8 shrink-0 lg:hidden"
	/>

	{#if Icon}
		<Icon class="hidden size-5 shrink-0 text-light-two lg:block dark:text-dark-two" />
	{/if}

	<h1
		class="min-w-0 flex-1 truncate text-base font-semibold text-light-two md:text-lg dark:text-dark-two"
	>
		{title}
	</h1>
</header>
