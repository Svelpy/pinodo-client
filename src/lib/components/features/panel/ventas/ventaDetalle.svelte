<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/index.ts';
	import { METODO_PAGO_LABEL, VENTA_ESTADO } from '#lib/constants/index.ts';
	import { PhoneIcon, WhatsappIcon } from '#lib/icons/outline/index.ts';
	import type { VentaDetalle } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTime,
		formatValue,
		normalizarTelefonoWhatsapp
	} from '#lib/utils/index.ts';
	import VentaCanal from './ventaCanal.svelte';
	import VentaEstadoBadge from './ventaEstadoBadge.svelte';

	interface Props {
		venta: VentaDetalle;
		/** Quién la registró, si se conoce */
		vendedor?: string | null;
	}

	let { venta, vendedor = null }: Props = $props();

	const unidades = $derived(venta.items.reduce((sum, item) => sum + item.cantidad, 0));
	const whatsapp = $derived(normalizarTelefonoWhatsapp(venta.cliente_telefono));
	const cancelada = $derived(venta.estado === VENTA_ESTADO.CANCELADA);

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
	const cardClass =
		'border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one';
	const dtClass = 'text-light-two_d dark:text-dark-two_d';
	const ddClass = 'text-right font-medium text-light-two dark:text-dark-two';
</script>

<div
	class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]"
>
	<!-- Prendas -->
	<section class={cardClass} aria-labelledby="venta-items-title">
		<h2
			id="venta-items-title"
			class="border-b border-light-one_d px-4 py-3 font-semibold text-light-two dark:border-dark-one_d dark:text-dark-two"
		>
			Prendas
			<span class="font-normal text-light-two_d dark:text-dark-two_d">({unidades})</span>
		</h2>

		<!-- Móvil: lista -->
		<ul class="divide-y divide-light-one_d md:hidden dark:divide-dark-one_d">
			{#each venta.items as item (item.id)}
				<li class="flex gap-3 px-4 py-3">
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium text-light-two dark:text-dark-two">
							{item.producto_nombre}
						</p>
						<p class="text-sm text-light-two_d dark:text-dark-two_d">
							{item.color_nombre} · Talla {item.talla_etiqueta}
						</p>
						<p class="mt-1 text-xs text-light-two_d tabular-nums dark:text-dark-two_d">
							{item.cantidad} × {formatCurrency(item.precio_unitario)}
							{#if item.descuento_unitario > 0}
								− {formatCurrency(item.descuento_unitario)} c/u
							{/if}
						</p>
					</div>
					<p class="shrink-0 font-semibold text-light-two tabular-nums dark:text-dark-two">
						{formatCurrency(item.subtotal)}
					</p>
				</li>
			{/each}
		</ul>

		<!-- Escritorio: tabla -->
		<div class="hidden overflow-x-auto md:block">
			<Table class="table-fixed text-sm">
				<TableHeader>
					<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
						<TableHead class={headClass}>Producto</TableHead>
						<TableHead class="{headClass} w-16 text-right">Cant.</TableHead>
						<TableHead class="{headClass} w-28 text-right">Precio</TableHead>
						<TableHead class="{headClass} hidden w-28 text-right xl:table-cell">Desc. c/u</TableHead
						>
						<TableHead class="{headClass} w-28 text-right">Subtotal</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each venta.items as item (item.id)}
						<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
							<TableCell class="px-4 py-3">
								<p class="truncate font-medium text-light-two dark:text-dark-two">
									{item.producto_nombre}
								</p>
								<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
									{item.color_nombre} · Talla {item.talla_etiqueta}{item.codigo_barras
										? ` · ${item.codigo_barras}`
										: ''}
								</p>
							</TableCell>
							<TableCell class="px-4 py-3 text-right tabular-nums">{item.cantidad}</TableCell>
							<TableCell class="px-4 py-3 text-right tabular-nums">
								{#if item.precio_unitario < item.precio_normal}
									<span class="block text-xs text-light-two_d line-through dark:text-dark-two_d">
										{formatCurrency(item.precio_normal)}
									</span>
								{/if}
								{formatCurrency(item.precio_unitario)}
							</TableCell>
							<TableCell class="hidden px-4 py-3 text-right tabular-nums xl:table-cell">
								{item.descuento_unitario > 0 ? formatCurrency(item.descuento_unitario) : '—'}
							</TableCell>
							<TableCell class="px-4 py-3 text-right font-semibold tabular-nums">
								{formatCurrency(item.subtotal)}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>

		<dl class="space-y-1 border-t border-light-one_d px-4 py-3 text-sm dark:border-dark-one_d">
			{#if venta.descuento > 0}
				<div class="flex justify-between">
					<dt class={dtClass}>Subtotal</dt>
					<dd class="tabular-nums">{formatCurrency(venta.subtotal)}</dd>
				</div>
				<div class="flex justify-between">
					<dt class={dtClass}>Descuento</dt>
					<dd class="tabular-nums">−{formatCurrency(venta.descuento)}</dd>
				</div>
			{/if}
			<div class="flex items-baseline justify-between">
				<dt class="font-semibold text-light-two dark:text-dark-two">Total</dt>
				<dd
					class={[
						'text-2xl font-bold tabular-nums',
						cancelada
							? 'text-light-two_d line-through dark:text-dark-two_d'
							: 'text-light-two dark:text-dark-two'
					]}
				>
					{formatCurrency(venta.total)}
				</dd>
			</div>
		</dl>
	</section>

	<!-- Datos de la venta -->
	<aside class="space-y-4">
		<section class="{cardClass} p-4" aria-label="Datos de la venta">
			<div class="mb-3 flex items-center justify-between gap-2">
				<VentaEstadoBadge estado={venta.estado} />
				<VentaCanal canal={venta.canal} />
			</div>
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between gap-3">
					<dt class={dtClass}>Método de pago</dt>
					<dd class={ddClass}>
						{venta.metodo_pago ? METODO_PAGO_LABEL[venta.metodo_pago] : formatValue(null)}
					</dd>
				</div>
				<div class="flex justify-between gap-3">
					<dt class={dtClass}>Cliente</dt>
					<dd class={ddClass}>{formatValue(venta.referencia)}</dd>
				</div>
				{#if venta.cliente_telefono}
					<div class="flex items-center justify-between gap-3">
						<dt class={dtClass}>Teléfono</dt>
						<dd class="flex items-center gap-1">
							<a
								href="tel:{venta.cliente_telefono}"
								class="inline-flex h-9 items-center gap-1.5 px-1 font-medium text-light-three hover:underline dark:text-dark-three"
							>
								<PhoneIcon class="size-4" />
								{venta.cliente_telefono}
							</a>
							{#if whatsapp}
								<!-- Enlace externo a WhatsApp, no una ruta de la app -->
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a
									href="https://wa.me/{whatsapp}"
									target="_blank"
									rel="noopener noreferrer"
									aria-label="Abrir chat de WhatsApp"
									class="inline-flex size-9 items-center justify-center text-light-success hover:bg-light-one_d dark:text-dark-success dark:hover:bg-dark-one_d"
								>
									<WhatsappIcon class="size-5" />
								</a>
							{/if}
						</dd>
					</div>
				{/if}
				{#if vendedor}
					<div class="flex justify-between gap-3">
						<dt class={dtClass}>Registrada por</dt>
						<dd class={ddClass}>{vendedor}</dd>
					</div>
				{/if}
			</dl>
			{#if venta.nota}
				<div class="mt-3 border-t border-light-one_d pt-3 dark:border-dark-one_d">
					<p
						class="text-xs font-medium tracking-wide text-light-two_d uppercase dark:text-dark-two_d"
					>
						Nota
					</p>
					<p class="mt-1 text-sm whitespace-pre-line text-light-two dark:text-dark-two">
						{venta.nota}
					</p>
				</div>
			{/if}
		</section>

		<section class="{cardClass} p-4" aria-label="Historial">
			<ol class="space-y-3 text-sm">
				<li class="flex justify-between gap-3">
					<span class={dtClass}>Registrada</span>
					<span class="text-light-two dark:text-dark-two">{formatDateTime(venta.created_at)}</span>
				</li>
				{#if venta.confirmada_at}
					<li class="flex justify-between gap-3">
						<span class={dtClass}>Cobrada</span>
						<span class="text-light-two dark:text-dark-two">
							{formatDateTime(venta.confirmada_at)}
						</span>
					</li>
				{/if}
				{#if venta.cancelada_at}
					<li class="flex justify-between gap-3">
						<span class="text-light-error dark:text-dark-error">
							{venta.confirmada_at ? 'Anulada' : 'Cancelada'}
						</span>
						<span class="text-light-two dark:text-dark-two">
							{formatDateTime(venta.cancelada_at)}
						</span>
					</li>
				{/if}
			</ol>
		</section>
	</aside>
</div>
