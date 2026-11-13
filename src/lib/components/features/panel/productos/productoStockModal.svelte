<script lang="ts">
	import { untrack } from 'svelte';
	import {
		AlertBox,
		Button,
		Input,
		SegmentedControl,
		SegmentedPicker,
		Sheet,
		TextArea
	} from '#lib/components/ui/index.ts';
	import { AJUSTE_MOTIVO, AJUSTE_MOTIVO_LABEL } from '#lib/constants/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { AjusteMotivoManual, ProductoSku } from '#lib/interfaces/index.ts';
	import {
		AppError,
		ajusteInventarioService,
		errorService,
		productoColorService
	} from '#lib/services/index.ts';
	import { alert, formatDateTime, formatNumber, validateSchema } from '#lib/utils/index.ts';
	import { AJUSTE_LIMITS, ajusteStockSchema } from '#lib/zod/index.ts';

	/**
	 * Ajuste de stock de un SKU con un documento de ajuste de inventario (`POST /ajustes-inventario/`)
	 * y, aparte, su stock mínimo (`PATCH /producto-colores/{id}`, fila
	 * `{ id, talla_id, precio, stock: { minimo } }`).
	 */
	interface Props {
		/** SKU a ajustar; null = cerrado */
		sku: ProductoSku | null;
		/** Para el título (p. ej. "Azul marino · talla M") */
		colorNombre?: string;
		/** Puede registrar ajustes de inventario (MOVIMIENTO_INVENTARIO:CREATE) */
		puedeAjustar?: boolean;
		/** Puede cambiar el stock mínimo (edita el color del producto) */
		puedeMinimo?: boolean;
		onClose: () => void;
		onSaved: (sku: ProductoSku) => void;
	}

	let {
		sku,
		colorNombre = '',
		puedeAjustar = true,
		puedeMinimo = true,
		onClose,
		onSaved
	}: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	// Lo habitual a la vista; robo/pérdida y corrección, tras "Más"
	const motivoOption = (value: AjusteMotivoManual) => ({
		value,
		label: AJUSTE_MOTIVO_LABEL[value]
	});
	const MOTIVOS_FRECUENTES = [
		AJUSTE_MOTIVO.RECEPCION,
		AJUSTE_MOTIVO.CONTEO,
		AJUSTE_MOTIVO.MERMA
	].map(motivoOption);
	const MOTIVOS_MAS = [AJUSTE_MOTIVO.ROBO_PERDIDA, AJUSTE_MOTIVO.CORRECCION].map(motivoOption);
	const SENTIDOS = [
		{ value: 'entrada' as const, label: 'Entran' },
		{ value: 'salida' as const, label: 'Salen' }
	];

	const AYUDA: Record<AjusteMotivoManual, string> = {
		RECEPCION: 'Llega mercadería. Su costo recalcula el costo promedio de la talla.',
		CONTEO: 'Escribe lo que hay en el estante: se registra la diferencia con el stock del sistema.',
		MERMA: 'Prendas dañadas o con defecto que dejan de venderse.',
		ROBO_PERDIDA: 'Prendas que faltan por robo o extravío.',
		CORRECCION:
			'Corrige un error de carga, en cualquier sentido. Explica qué se corrige en la nota.'
	};

	let motivo = $state<AjusteMotivoManual>(AJUSTE_MOTIVO.RECEPCION);
	let sentido = $state<'entrada' | 'salida'>('entrada');
	let cantidad = $state('');
	let costo = $state('');
	let nota = $state('');
	let minimo = $state('');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	const valores = $derived({ motivo, sentido, cantidad, costo, nota, minimo });
	const parsed = $derived(ajusteStockSchema.safeParse(valores));
	const hayAjuste = $derived(puedeAjustar && cantidad.trim() !== '');
	const minimoNuevo = $derived(
		puedeMinimo && parsed.success && parsed.data.minimo !== null && sku
			? parsed.data.minimo !== sku.stock.minimo
			: false
	);
	const hasChanges = $derived(hayAjuste || minimoNuevo);

	const esConteo = $derived(motivo === AJUSTE_MOTIVO.CONTEO);
	const sale = $derived(
		motivo === AJUSTE_MOTIVO.MERMA ||
			motivo === AJUSTE_MOTIVO.ROBO_PERDIDA ||
			(motivo === AJUSTE_MOTIVO.CORRECCION && sentido === 'salida')
	);

	// Lo que quedaría (el servidor lo aplica sobre el stock que tenga en ese momento)
	const resultante = $derived.by(() => {
		if (!sku || !/^\d+$/.test(cantidad.trim())) return null;
		const n = Number(cantidad.trim());
		if (esConteo) return n;
		return sku.stock.cantidad + (sale ? -n : n);
	});
	const quedaNegativo = $derived(resultante !== null && resultante < 0);
	const diferenciaConteo = $derived(
		esConteo && resultante !== null && sku ? resultante - sku.stock.cantidad : null
	);

	const cantidadLabel = $derived(
		esConteo ? 'Prendas contadas' : sale ? 'Prendas que salen' : 'Prendas que entran'
	);

	// Empezar de cero cada vez que se abre
	$effect(() => {
		if (!sku) return;
		untrack(() => {
			motivo = AJUSTE_MOTIVO.RECEPCION;
			sentido = 'entrada';
			cantidad = '';
			costo = '';
			nota = '';
			minimo = '';
			fieldErrors = {};
			formError = '';
		});
	});

	function handleClose() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	function mensajeError(error: unknown): string {
		// 409: salió más de lo que había (las ventas pudieron mover el stock mientras tanto)
		const stockActual =
			error instanceof AppError && error.is(ErrorCode.CONFLICT)
				? error.details.stock_actual
				: undefined;
		if (typeof stockActual === 'number') {
			return `El stock actual es ${formatNumber(stockActual)}: no alcanza para esta salida.`;
		}
		return errorService.getMessage(error);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!sku) return;
		formError = '';

		const result = validateSchema(ajusteStockSchema, valores);
		if (!result.success) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};
		if (!hasChanges) {
			fieldErrors =
				result.data.minimo !== null
					? { minimo: 'El mínimo es el mismo que ya tiene la talla.' }
					: { cantidad: 'Indica cuántas prendas.' };
			return;
		}
		if (quedaNegativo) return;

		const target = sku;
		let actualizado = target;
		const avisos: string[] = [];
		isLoading = true;
		try {
			// 1. El ajuste de stock
			const ajuste = puedeAjustar ? result.data.ajuste : null;
			if (ajuste) {
				try {
					const resultado = await ajusteInventarioService.create({
						motivo: ajuste.motivo,
						...(ajuste.nota && { nota: ajuste.nota }),
						items: [{ sku_id: target.id, ...ajuste.item }]
					});
					const movimiento = resultado.ajuste?.movimientos.find((m) => m.sku.id === target.id);
					if (resultado.ajuste && movimiento) {
						actualizado = {
							...actualizado,
							stock: {
								...actualizado.stock,
								cantidad: movimiento.saldo,
								actualizado: movimiento.created_at
							}
						};
						avisos.push(
							`Ajuste #${resultado.ajuste.numero} registrado: el stock quedó en ${formatNumber(movimiento.saldo)}.`
						);
					} else {
						avisos.push('El conteo coincide con el stock: no se registró ningún ajuste.');
					}
				} catch (error) {
					const apiErrors = errorService.getFieldErrors(error);
					fieldErrors = apiErrors;
					formError = Object.keys(apiErrors).length > 0 ? '' : mensajeError(error);
					return;
				}
			}

			// 2. El mínimo, aparte: si falla, el ajuste ya quedó registrado
			if (minimoNuevo && result.data.minimo !== null) {
				try {
					const color = await productoColorService.update(target.producto_color_id, {
						// La API exige talla y precio en cada fila con id (no cambian: los compara)
						skus: [
							{
								id: target.id,
								talla_id: target.talla_id,
								precio: target.precio,
								stock: { minimo: result.data.minimo }
							}
						]
					});
					actualizado = color.skus.find((s) => s.id === target.id) ?? {
						...actualizado,
						stock: { ...actualizado.stock, minimo: result.data.minimo }
					};
					avisos.push(`Stock mínimo: ${formatNumber(result.data.minimo)}.`);
				} catch (error) {
					if (actualizado !== target) {
						onSaved(actualizado);
						// Sin la cantidad, reintentar no repite el ajuste
						cantidad = '';
						formError = `${avisos.join(' ')} Pero no se pudo cambiar el mínimo: ${errorService.getMessage(error)}`;
					} else {
						formError = errorService.getMessage(error);
					}
					return;
				}
			}

			alert('success', avisos.join(' ') || `Talla ${target.talla.etiqueta} actualizada.`);
			onSaved(actualizado);
			onClose();
		} finally {
			isLoading = false;
		}
	}
</script>

<Sheet
	open={!!sku}
	onClose={handleClose}
	dismissible={!isLoading}
	title="Ajustar stock"
	description={sku
		? `${colorNombre ? `${colorNombre} · ` : ''}Talla ${sku.talla.etiqueta}. Última actualización: ${formatDateTime(sku.stock.actualizado)}.`
		: ''}
>
	<form id={FORM_ID} onsubmit={handleSubmit} novalidate class="space-y-4">
		{#if formError}
			<AlertBox>{formError}</AlertBox>
		{/if}

		{#if sku}
			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				Stock actual:
				<span class="font-semibold text-light-two dark:text-dark-two">
					{formatNumber(sku.stock.cantidad)}
				</span>
				· mínimo {formatNumber(sku.stock.minimo)}
			</p>
		{/if}

		{#if puedeAjustar}
			<fieldset class="space-y-4" disabled={isLoading}>
				<div>
					<SegmentedPicker
						label="Motivo"
						options={MOTIVOS_FRECUENTES}
						more={MOTIVOS_MAS}
						moreLabel="Más motivos"
						value={motivo}
						onChange={(value: AjusteMotivoManual) => (motivo = value)}
						columns={2}
						disabled={isLoading}
						error={fieldErrors.motivo}
					/>
					<p class="mt-1.5 text-xs text-light-two_d dark:text-dark-two_d">{AYUDA[motivo]}</p>
				</div>

				{#if motivo === AJUSTE_MOTIVO.CORRECCION}
					<SegmentedControl
						label="Sentido"
						options={SENTIDOS}
						value={sentido}
						onChange={(value) => (sentido = value)}
						disabled={isLoading}
					/>
				{/if}

				<div class="grid gap-4 sm:grid-cols-2">
					<Input
						id="{id}-cantidad"
						label={cantidadLabel}
						bind:value={cantidad}
						error={fieldErrors.cantidad}
						aria-invalid={!!fieldErrors.cantidad}
						inputmode="numeric"
						autocomplete="off"
						placeholder="Ej. 5"
					/>
					{#if motivo === AJUSTE_MOTIVO.RECEPCION}
						<Input
							id="{id}-costo"
							label="Costo por prenda (Bs)"
							bind:value={costo}
							error={fieldErrors.costo}
							aria-invalid={!!fieldErrors.costo}
							inputmode="decimal"
							autocomplete="off"
							placeholder="0,00"
						/>
					{/if}
				</div>

				{#if resultante !== null}
					<p
						role="status"
						class={[
							'text-sm',
							quedaNegativo
								? 'text-light-error dark:text-dark-error'
								: 'text-light-two dark:text-dark-two'
						]}
					>
						{#if quedaNegativo}
							No hay suficiente stock: la salida dejaría {formatNumber(resultante)}.
						{:else if diferenciaConteo === 0}
							Coincide con el stock: no se registrará ningún ajuste.
						{:else if diferenciaConteo !== null}
							Diferencia de
							<strong>{diferenciaConteo > 0 ? '+' : ''}{formatNumber(diferenciaConteo)}</strong>: el
							stock quedará en <strong>{formatNumber(resultante)}</strong>.
						{:else}
							El stock quedará en <strong>{formatNumber(resultante)}</strong>.
						{/if}
					</p>
				{/if}

				<TextArea
					id="{id}-nota"
					label={motivo === AJUSTE_MOTIVO.CORRECCION ? 'Nota' : 'Nota (opcional)'}
					rows={2}
					placeholder={motivo === AJUSTE_MOTIVO.RECEPCION
						? 'p. ej. Factura 4521'
						: 'p. ej. Prendas manchadas en el probador'}
					maxlength={AJUSTE_LIMITS.NOTA_MAX}
					bind:value={nota}
					error={fieldErrors.nota}
				/>
			</fieldset>
		{/if}

		{#if puedeMinimo}
			<fieldset disabled={isLoading}>
				<Input
					id="{id}-minimo"
					label="Nuevo stock mínimo (opcional)"
					bind:value={minimo}
					error={fieldErrors.minimo}
					aria-invalid={!!fieldErrors.minimo}
					inputmode="numeric"
					autocomplete="off"
					placeholder={sku ? String(sku.stock.minimo) : ''}
				/>
			</fieldset>
		{/if}
		<p class="text-xs text-light-two_d dark:text-dark-two_d">
			El ajuste se aplica sobre el stock que tenga la talla en ese momento, así no pisa las ventas
			que ocurran mientras tanto, y queda en el kardex. Por debajo del mínimo la talla se marca con
			stock bajo.
		</p>
	</form>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
			<Button variant="outline" onclick={handleClose} disabled={isLoading} class="w-full sm:w-auto">
				Cancelar
			</Button>
			<Button
				type="submit"
				form={FORM_ID}
				loading={isLoading}
				disabled={!hasChanges || quedaNegativo}
				class="w-full sm:w-auto"
			>
				{hayAjuste ? 'Registrar ajuste' : 'Guardar mínimo'}
			</Button>
		</div>
	{/snippet}
</Sheet>
