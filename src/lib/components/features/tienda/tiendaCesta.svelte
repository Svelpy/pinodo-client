<script lang="ts">
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly, slide } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { TiendaConfigPublica } from '#lib/interfaces/index.ts';
	import { cestaItems, cestaStore, cestaTotal } from '#lib/stores/index.ts';
	import {
		CESTA_MAX_CANTIDAD,
		duracion,
		formatCurrency,
		imagenUrl,
		mensajePedido,
		slugIdParam,
		whatsappUrl
	} from '#lib/utils/index.ts';

	interface Props {
		tienda: TiendaConfigPublica;
		/** Al seguir un enlace a un producto (cierra el drawer) */
		onNavigate?: () => void;
	}

	let { tienda, onNavigate }: Props = $props();

	let nombre = $state('');
	let nota = $state('');
	let enviado = $state(false);

	const disponibles = $derived($cestaItems.filter((i) => !i.agotado));
	const enlace = $derived(
		whatsappUrl(
			tienda.whatsapp,
			mensajePedido($cestaItems, {
				tienda: tienda.nombre_tienda,
				origin: page.url.origin,
				nombre,
				nota
			})
		)
	);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- enlace externo a wa.me -->
<div class="text-editorial">
	{#if $cestaItems.length === 0}
		<div class="py-16 text-center" in:fade={{ duration: duracion(300) }}>
			<p>Tu cesta está vacía.</p>
			<a
				href={resolve('/(tienda)')}
				onclick={onNavigate}
				class="mt-6 inline-block underline underline-offset-4"
			>
				Seguir comprando
			</a>
		</div>
	{:else}
		<!-- relative: Svelte fija con position absolute la línea que sale mientras las demás suben -->
		<ul class="relative divide-y divide-light-two/15 dark:divide-dark-two/15">
			{#each $cestaItems as item (item.sku_id)}
				{@const href = resolve('/(tienda)/[producto=producto]', {
					producto: slugIdParam({ slug: item.slug, id: item.producto_id }, 'p')
				})}
				<li
					class={[
						'flex gap-4 bg-light-one py-5 first:pt-0 dark:bg-dark-one',
						item.agotado && 'opacity-60'
					]}
					animate:flip={{ duration: duracion(300), easing: cubicOut }}
					in:fly={{ x: 24, duration: duracion(300), easing: cubicOut }}
					out:fly={{ x: 48, duration: duracion(220) }}
				>
					<a
						{href}
						onclick={onNavigate}
						class="w-20 shrink-0 sm:w-24"
						tabindex="-1"
						aria-hidden="true"
					>
						{#if item.imagen}
							<img
								src={imagenUrl(item.imagen, 200)}
								alt=""
								loading="lazy"
								class="aspect-3/4 w-full bg-light-one_d object-cover dark:bg-dark-one_d"
							/>
						{:else}
							<div class="aspect-3/4 w-full bg-light-one_d dark:bg-dark-one_d"></div>
						{/if}
					</a>

					<div class="flex min-w-0 flex-1 flex-col gap-1">
						<a {href} onclick={onNavigate} class="truncate font-semibold hover:underline">
							{item.nombre}
						</a>
						<p class="text-light-two_d dark:text-dark-two_d">{item.color} · {item.talla}</p>
						{#if item.agotado}
							<p class="text-light-error dark:text-dark-error">
								Agotado: no se incluirá en el pedido
							</p>
						{:else}
							<p>
								{formatCurrency(item.precio)}
								{#if item.precio_normal > item.precio}
									<s class="ml-1 text-light-two_d dark:text-dark-two_d"
										>{formatCurrency(item.precio_normal)}</s
									>
								{/if}
							</p>
						{/if}

						<div class="mt-auto flex items-center justify-between pt-2">
							<div class="flex items-center border border-light-two/25 dark:border-dark-two/30">
								<button
									type="button"
									onclick={() => cestaStore.cambiarCantidad(item.sku_id, item.cantidad - 1)}
									aria-label="Quitar una unidad de {item.nombre}"
									class="size-8 hover:bg-light-one_d dark:hover:bg-dark-one_d"
								>
									−
								</button>
								<span class="w-8 text-center tabular-nums" aria-live="polite">
									<span class="sr-only">Cantidad:</span>
									{#key item.cantidad}
										<span class="inline-block" in:fly={{ y: -8, duration: duracion(200) }}>
											{item.cantidad}
										</span>
									{/key}
								</span>
								<button
									type="button"
									onclick={() => cestaStore.cambiarCantidad(item.sku_id, item.cantidad + 1)}
									disabled={item.cantidad >= CESTA_MAX_CANTIDAD || item.agotado}
									aria-label="Agregar una unidad de {item.nombre}"
									class="size-8 hover:bg-light-one_d disabled:opacity-40 dark:hover:bg-dark-one_d"
								>
									+
								</button>
							</div>
							<button
								type="button"
								onclick={() => cestaStore.quitar(item.sku_id)}
								class="underline-offset-4 hover:underline"
							>
								Eliminar
							</button>
						</div>
					</div>
				</li>
			{/each}
		</ul>

		<div class="mt-6 space-y-5 border-t border-light-two/15 pt-6 dark:border-dark-two/15">
			<div class="flex items-baseline justify-between text-sm font-semibold">
				<span>Total</span>
				{#key $cestaTotal}
					<span class="tabular-nums" in:fade={{ duration: duracion(250) }}>
						{formatCurrency($cestaTotal)}
					</span>
				{/key}
			</div>
			<p class="text-xs tracking-normal text-light-two_d normal-case dark:text-dark-two_d">
				El pedido se envía por WhatsApp a la tienda, que te confirmará disponibilidad, precio final,
				forma de pago y entrega.
			</p>

			{#if enlace}
				<div class="space-y-4">
					<label class="block">
						<span class="mb-1 block">Tu nombre (opcional)</span>
						<input
							type="text"
							bind:value={nombre}
							maxlength="60"
							autocomplete="name"
							class="w-full border-0 border-b border-current bg-transparent px-0 text-sm normal-case focus:ring-0"
						/>
					</label>
					<label class="block">
						<span class="mb-1 block">Nota para la tienda (opcional)</span>
						<textarea
							bind:value={nota}
							maxlength="300"
							rows="2"
							placeholder="Ej.: envío a domicilio, recojo en tienda…"
							class="w-full resize-none border-0 border-b border-current bg-transparent px-0 text-sm normal-case focus:ring-0"
						></textarea>
					</label>

					{#if disponibles.length > 0}
						<a
							href={enlace}
							target="_blank"
							rel="noopener"
							onclick={() => (enviado = true)}
							class="flex h-12 w-full items-center justify-center bg-light-two text-light-one hover:bg-light-three dark:bg-dark-two dark:text-dark-one"
						>
							Enviar pedido por WhatsApp
						</a>
					{/if}

					{#if enviado}
						<div
							class="flex items-center justify-between gap-3 text-light-two_d dark:text-dark-two_d"
							role="status"
							transition:slide={{ duration: duracion(250) }}
						>
							<span>¿Ya enviaste tu pedido?</span>
							<button
								type="button"
								onclick={() => {
									cestaStore.vaciar();
									enviado = false;
								}}
								class="underline underline-offset-4"
							>
								Vaciar cesta
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="space-y-2">
					<p>Para hacer tu pedido contáctanos:</p>
					{#if tienda.telefono}
						<p>
							<a
								href="tel:{tienda.telefono.replace(/\s/g, '')}"
								class="underline underline-offset-4">{tienda.telefono}</a
							>
						</p>
					{/if}
					{#if tienda.email_contacto}
						<p class="tracking-normal normal-case">
							<a href="mailto:{tienda.email_contacto}" class="underline underline-offset-4"
								>{tienda.email_contacto}</a
							>
						</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
