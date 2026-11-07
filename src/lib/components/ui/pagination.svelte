<script lang="ts">
	import { ChevronLeftIcon } from '#lib/icons/outline/index.ts';
	import ChevronRightIcon from '#lib/icons/outline/chevronRightIcon.svelte';

	interface Props {
		currentPage: number;
		totalPages: number;
		perPage: number;
		total: number;
		onPageChange: (page: number) => void;
		maxVisiblePages?: number;
	}

	let {
		currentPage,
		totalPages,
		perPage,
		total,
		onPageChange,
		maxVisiblePages = 10
	}: Props = $props();

	function getVisiblePages(): number[] {
		const maxVisible = maxVisiblePages;
		let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
		let end = Math.min(totalPages, start + maxVisible - 1);

		if (end - start + 1 < maxVisible) {
			start = Math.max(1, end - maxVisible + 1);
		}

		end = Math.min(totalPages, start + maxVisible - 1);

		const pages: number[] = [];
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		return pages;
	}

	function handlePageClick(page: number) {
		if (page === currentPage || page < 1 || page > totalPages) return;
		onPageChange(page);
	}

	function goToPreviousPage() {
		if (currentPage > 1) {
			onPageChange(currentPage - 1);
		}
	}

	function goToNextPage() {
		if (currentPage < totalPages) {
			onPageChange(currentPage + 1);
		}
	}

	let startItem = $derived((currentPage - 1) * perPage + 1);
	let endItem = $derived(Math.min(currentPage * perPage, total));
	let visiblePages = $derived(getVisiblePages());
</script>

<div class="flex flex-col gap-4 px-4 py-3 sm:px-6">
	<div class="hidden w-full items-center justify-between md:flex">
		<div class="flex items-center gap-4">
			<p class="text-sm text-light-black">
				Mostrando <span class="font-medium">{startItem}</span> a
				<span class="font-medium">{endItem}</span> de
				<span class="font-medium">{total}</span> resultados
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				onclick={goToPreviousPage}
				disabled={currentPage === 1}
				class="inline-flex h-9 w-9 items-center justify-center border border-light-four bg-light-one text-sm font-medium text-light-two_d transition-colors hover:bg-light-one_d disabled:cursor-not-allowed disabled:opacity-40"
				title="Página anterior"
			>
				<ChevronLeftIcon />
			</button>

			<div class="flex items-center gap-1">
				{#each visiblePages as page (page)}
					<button
						onclick={() => handlePageClick(page)}
						class="inline-flex h-9 min-w-9 items-center justify-center border px-3 text-sm font-medium transition-colors {page ===
						currentPage
							? 'border-light-three bg-light-two text-light-one'
							: 'border-light-four bg-light-one text-light-two_d hover:bg-light-one_d'}"
					>
						{page}
					</button>
				{/each}
			</div>

			<button
				onclick={goToNextPage}
				disabled={currentPage === totalPages}
				class="inline-flex h-9 w-9 items-center justify-center border border-light-four bg-light-one text-sm font-medium text-light-two_d transition-colors hover:bg-light-one_d disabled:cursor-not-allowed disabled:opacity-40"
				title="Página siguiente"
			>
				<ChevronRightIcon />
			</button>
		</div>
	</div>

	<div class="flex w-full flex-col items-center gap-3 md:hidden">
		<div class="flex w-full items-center justify-between">
			<button
				onclick={goToPreviousPage}
				disabled={currentPage === 1}
				class="inline-flex h-10 w-10 items-center justify-center border border-light-four bg-light-one text-light-two_d transition-colors active:bg-light-one_d disabled:opacity-30"
			>
				<ChevronLeftIcon />
			</button>

			<div class="flex items-center gap-1.5">
				{#each visiblePages.filter((p) => Math.abs(p - currentPage) <= 1) as page (page)}
					<button
						onclick={() => handlePageClick(page)}
						class="inline-flex h-10 min-w-10 items-center justify-center border px-3 text-sm font-semibold transition-colors {page ===
						currentPage
							? 'border-light-three bg-light-two text-light-one'
							: 'border-light-four bg-light-one text-light-two_d'}"
					>
						{page}
					</button>
				{/each}
			</div>

			<button
				onclick={goToNextPage}
				disabled={currentPage === totalPages}
				class="inline-flex h-10 w-10 items-center justify-center border border-light-four bg-light-one text-light-two_d transition-colors active:bg-light-one_d disabled:opacity-30"
			>
				<ChevronRightIcon />
			</button>
		</div>
		<p class="text-xs font-medium text-light-two">
			Página <span class="text-light-black">{currentPage}</span> de
			<span class="text-light-black">{totalPages}</span>
		</p>
	</div>
</div>
