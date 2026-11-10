<script lang="ts" generics="T extends string">
	import type { Component } from 'svelte';
	import { cn } from '#lib/utils/index.ts';

	/**
	 * Grupo de opciones excluyentes como botones en fila (radiogroup accesible). Para elegir entre
	 * pocas opciones que deben verse todas a la vez, p. ej. el método de pago.
	 */
	interface Props {
		/** Nombre accesible del grupo */
		label: string;
		/** Muestra la etiqueta encima; si no, solo es accesible */
		showLabel?: boolean;
		options: readonly { value: T; label: string; icon?: Component<{ class?: string }> }[];
		/** null = ninguna elegida */
		value: T | null;
		onChange: (value: T) => void;
		disabled?: boolean;
		error?: string;
		size?: 'md' | 'lg';
		class?: string;
	}

	let {
		label,
		showLabel = true,
		options,
		value,
		onChange,
		disabled = false,
		error,
		size = 'md',
		class: className
	}: Props = $props();

	const id = $props.id();
	let buttons = $state<HTMLButtonElement[]>([]);

	// Con ninguna elegida, el foco entra por la primera opción
	const focusIndex = $derived(
		Math.max(
			0,
			options.findIndex((option) => option.value === value)
		)
	);

	// Flechas mueven y eligen (patrón radiogroup de WAI-ARIA)
	function handleKeydown(event: KeyboardEvent, index: number) {
		const last = options.length - 1;
		const next: Record<string, number> = {
			ArrowRight: index === last ? 0 : index + 1,
			ArrowDown: index === last ? 0 : index + 1,
			ArrowLeft: index === 0 ? last : index - 1,
			ArrowUp: index === 0 ? last : index - 1
		};
		const target = next[event.key];
		if (target === undefined) return;
		event.preventDefault();
		buttons[target]?.focus();
		onChange(options[target].value);
	}
</script>

<div class={cn('min-w-0', className)}>
	{#if showLabel}
		<p id="{id}-label" class="mb-1.5 text-sm font-medium text-light-two dark:text-dark-two">
			{label}
		</p>
	{/if}
	<div
		role="radiogroup"
		aria-label={showLabel ? undefined : label}
		aria-labelledby={showLabel ? `${id}-label` : undefined}
		aria-invalid={!!error}
		aria-describedby={error ? `${id}-error` : undefined}
		class={cn(
			'grid gap-1 border bg-light-one_d p-1 dark:bg-dark-one_d',
			error
				? 'border-light-error dark:border-dark-error'
				: 'border-light-one_d dark:border-dark-one_d'
		)}
		style:grid-template-columns="repeat({options.length}, minmax(0, 1fr))"
	>
		{#each options as option, index (option.value)}
			{@const selected = option.value === value}
			<button
				bind:this={buttons[index]}
				type="button"
				role="radio"
				aria-checked={selected}
				tabindex={index === focusIndex ? 0 : -1}
				{disabled}
				onclick={() => onChange(option.value)}
				onkeydown={(event) => handleKeydown(event, index)}
				class={cn(
					'flex min-w-0 items-center justify-center gap-1.5 px-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-dark-three',
					size === 'lg' ? 'h-12 text-sm sm:text-base' : 'h-10 text-sm',
					selected
						? 'bg-light-three text-light-one dark:bg-dark-three dark:text-dark-one'
						: 'text-light-two_d hover:bg-light-one hover:text-light-two dark:text-dark-two_d dark:hover:bg-dark-one dark:hover:text-dark-two'
				)}
			>
				{#if option.icon}
					<option.icon class="size-4 shrink-0" />
				{/if}
				<span class="truncate">{option.label}</span>
			</button>
		{/each}
	</div>
	{#if error}
		<p id="{id}-error" role="alert" class="mt-1 text-sm text-light-error dark:text-dark-error">
			{error}
		</p>
	{/if}
</div>
