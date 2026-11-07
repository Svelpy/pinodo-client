<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { NavItem } from '#lib/interfaces/index.ts';
	import { isNavItemActive } from '#lib/utils/index.ts';

	interface Props {
		item: NavItem;
		pathname: string;
	}

	let { item, pathname }: Props = $props();

	const children = $derived(item.children ?? []);
	const activeChildId = $derived(children.find((child) => isNavItemActive(child, pathname))?.id);
	// El padre es una página más: abrirla (o una de sus hijas) despliega el submenú
	const selfActive = $derived(isNavItemActive(item, pathname));
	const open = $derived(children.length > 0 && (selfActive || activeChildId !== undefined));
	// Con un hijo abierto el resaltado lo lleva el hijo; el padre solo queda en negrita
	const active = $derived(selfActive && activeChildId === undefined);

	const focusRing =
		'focus-visible:ring-2 focus-visible:ring-light-one/60 focus-visible:outline-none dark:focus-visible:ring-dark-two/60';
	const idle =
		'text-light-one/70 hover:bg-white/5 hover:text-light-one dark:text-dark-two/70 dark:hover:bg-dark-two/5 dark:hover:text-dark-two';
	const selected = 'bg-white/10 text-light-one dark:bg-dark-two/10 dark:text-dark-two';
</script>

<a
	href={item.href}
	aria-current={active ? 'page' : undefined}
	class={[
		'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
		focusRing,
		active ? `${selected} font-semibold` : idle,
		!active && open && 'font-semibold text-light-one dark:text-dark-two'
	]}
>
	<item.icon class="size-5 shrink-0" />
	<span class="truncate">{item.label}</span>
</a>

{#if open}
	<ul class="mt-0.5 space-y-0.5" transition:slide={{ duration: 150 }}>
		{#each children as child (child.id)}
			{@const childActive = child.id === activeChildId}
			<li>
				<a
					href={child.href}
					aria-current={childActive ? 'page' : undefined}
					class={[
						// pl-11 alinea el texto del hijo con el del padre (px-3 + icono size-5 + gap-3)
						'block truncate py-1.5 pr-3 pl-11 text-sm transition-colors',
						focusRing,
						childActive ? `${selected} font-medium` : idle
					]}
				>
					{child.label}
				</a>
			</li>
		{/each}
	</ul>
{/if}
