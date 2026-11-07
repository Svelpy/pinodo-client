<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		/** Texto de la fecha de última actualización, tal como figura en el documento */
		updatedAt: string;
		children: Snippet;
	}

	let { title, updatedAt, children }: Props = $props();
</script>

<article
	class="prose max-w-none text-light-two_d marker:text-light-three dark:text-dark-two_d dark:marker:text-dark-three prose-headings:text-light-two dark:prose-headings:text-dark-two prose-h2:mt-10 prose-h2:text-xl prose-strong:text-light-two dark:prose-strong:text-dark-two prose-li:my-1.5"
>
	<header class="not-prose mb-8 border-b border-light-one_d pb-6 dark:border-dark-one_d">
		<h1 class="text-2xl font-bold tracking-tight text-light-two md:text-3xl dark:text-dark-two">
			{title}
		</h1>
		<p class="mt-2 text-sm text-light-four_d dark:text-dark-four_d">
			Última actualización: {updatedAt}
		</p>
	</header>

	{@render children()}
</article>
