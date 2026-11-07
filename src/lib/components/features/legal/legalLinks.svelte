<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { LEGAL_PAGES } from '#lib/constants/index.ts';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<nav aria-label="Información legal" class={className}>
	<ul class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
		{#each LEGAL_PAGES as legal (legal.href)}
			{@const href = resolve(legal.href)}
			<li>
				<a
					{href}
					aria-current={page.url.pathname === href ? 'page' : undefined}
					class="text-light-four_d transition-colors hover:text-light-three aria-[current=page]:font-semibold aria-[current=page]:text-light-three dark:text-dark-four_d dark:hover:text-dark-three dark:aria-[current=page]:text-dark-three"
				>
					{legal.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
