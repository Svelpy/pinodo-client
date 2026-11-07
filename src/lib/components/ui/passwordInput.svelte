<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { EyeIcon, EyeOffIcon } from '#lib/icons/outline/index.ts';
	import Input from './input.svelte';

	interface Props extends Omit<ComponentProps<typeof Input>, 'trailing' | 'type' | 'icon'> {
		value?: string | null;
	}

	let { value = $bindable(), ...restProps }: Props = $props();

	let visible = $state(false);
</script>

<!-- Input de contraseña con botón para mostrar u ocultar lo escrito -->
<Input {...restProps} bind:value type={visible ? 'text' : 'password'}>
	{#snippet trailing()}
		<button
			type="button"
			onclick={() => (visible = !visible)}
			aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
			aria-pressed={visible}
			disabled={restProps.disabled}
			class="p-1.5 text-light-two_d transition-colors hover:text-light-two focus-visible:outline-1 focus-visible:outline-light-two disabled:opacity-50"
		>
			{#if visible}
				<EyeIcon class="size-5" />
			{:else}
				<EyeOffIcon class="size-5" />
			{/if}
		</button>
	{/snippet}
</Input>
