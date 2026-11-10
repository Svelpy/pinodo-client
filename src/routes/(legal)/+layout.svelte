<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { LegalLinks } from '#lib/components/features/legal/index.ts';
	import { APP_SITE_CONFIG } from '#lib/constants/index.ts';

	let { children } = $props();
</script>

<div
	class="flex min-h-dvh flex-col bg-light-one text-light-two dark:bg-dark-one dark:text-dark-two"
>
	<header class="border-b border-light-one_d dark:border-dark-one_d">
		<div class="container mx-auto flex items-center px-4 py-4 md:px-6">
			<a href={resolve('/(tienda)')} class="flex items-center gap-2.5">
				<img
					src={asset('images/logo_mark.webp')}
					alt=""
					width="40"
					height="40"
					class="size-10 rounded-xl object-cover ring-1 ring-light-four dark:ring-dark-four"
				/>
				<span class="text-lg font-bold tracking-tight">{APP_SITE_CONFIG.APP_NAME}</span>
			</a>
		</div>
	</header>

	<main class="container mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6 md:py-14">
		{@render children()}
	</main>

	<footer
		class="space-y-3 border-t border-light-one_d py-6 text-center text-sm text-light-two_d dark:border-dark-one_d dark:text-dark-two_d"
	>
		<LegalLinks />
		<p>© {new Date().getFullYear()} {APP_SITE_CONFIG.APP_NAME}</p>
	</footer>
</div>
