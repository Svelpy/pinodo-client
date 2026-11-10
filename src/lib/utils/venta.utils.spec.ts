import { describe, expect, it } from 'vitest';
import type { CarritoLinea, SkuInventario, VentaDetalle } from '#lib/interfaces/index.ts';
import {
	accionesVenta,
	addDaysISO,
	agregarAlCarrito,
	agruparInventario,
	buildWhatsappUrl,
	calcularCambio,
	calcularLinea,
	calcularTotales,
	descontarStock,
	hayPreciosDistintos,
	lineasDesdeVenta,
	mensajeWhatsappVenta,
	normalizarTelefonoWhatsapp,
	parseMonto,
	rangoFechas,
	sincronizarLineas,
	toItemsRequest,
	validarLinea,
	ventaFiltrosToParams
} from './venta.utils';

function sku(overrides: Partial<SkuInventario> = {}): SkuInventario {
	return {
		id: 's1',
		producto_color_id: 'pc1',
		talla_id: 't1',
		codigo_barras: '8412345678905',
		is_visible: true,
		precio: { normal: 29.95, rebajado: 19.95, rebaja_hasta: '2026-12-31' },
		stock: { cantidad: 3, minimo: 1, actualizado: '2026-10-29T15:00:00Z' },
		created_at: '',
		updated_at: '',
		precio_vigente: 19.95,
		producto_id: 'p1',
		producto_nombre: 'Camisa Oxford',
		color_id: 'c1',
		color_nombre: 'Azul marino',
		color_codigo_hex: '#1E3A8A',
		talla_etiqueta: 'M',
		...overrides
	};
}

function linea(overrides: Partial<CarritoLinea> = {}): CarritoLinea {
	return {
		sku_id: 's1',
		producto_nombre: 'Camisa Oxford',
		color_nombre: 'Azul marino',
		color_codigo_hex: '#1E3A8A',
		talla_etiqueta: 'M',
		codigo_barras: null,
		precio_normal: 29.95,
		precio_unitario: 19.95,
		precio_actual: 19.95,
		stock: 5,
		cantidad: 1,
		descuento_unitario: '',
		...overrides
	};
}

const venta: VentaDetalle = {
	id: 'v1',
	numero: 12,
	estado: 'PENDIENTE',
	canal: 'WHATSAPP',
	metodo_pago: 'QR',
	referencia: 'María López',
	cliente_telefono: '71234567',
	subtotal: 84.8,
	descuento: 4.8,
	total: 80,
	nota: 'Recoge el sábado',
	confirmada_at: null,
	cancelada_at: null,
	created_at: '',
	created_by: 'u1',
	updated_at: '',
	items: [
		{
			id: 'i1',
			sku_id: 's1',
			cantidad: 2,
			precio_normal: 29.95,
			precio_unitario: 19.95,
			descuento_unitario: 0,
			subtotal: 39.9,
			producto_nombre: 'Camisa Oxford',
			color_nombre: 'Azul marino',
			talla_etiqueta: 'M',
			codigo_barras: null
		},
		{
			id: 'i2',
			sku_id: 's2',
			cantidad: 1,
			precio_normal: 49.9,
			precio_unitario: 49.9,
			descuento_unitario: 5,
			subtotal: 44.9,
			producto_nombre: 'Pantalón chino',
			color_nombre: 'Beige',
			talla_etiqueta: '42',
			codigo_barras: null
		}
	]
};

describe('montos', () => {
	it('parseMonto acepta coma o punto y hasta 2 decimales', () => {
		expect(parseMonto('')).toBe(0);
		expect(parseMonto('12,5')).toBe(12.5);
		expect(parseMonto('3.10')).toBe(3.1);
		expect(parseMonto('1.234')).toBeNull();
		expect(parseMonto('-2')).toBeNull();
	});

	it('calcula en céntimos sin errores de coma flotante', () => {
		const lineas = [
			linea({ cantidad: 3, descuento_unitario: '0,10' }),
			linea({ sku_id: 's2', precio_unitario: 0.1, precio_actual: 0.1, cantidad: 2 })
		];
		expect(calcularLinea(lineas[0])).toBe(59.55);
		expect(calcularTotales(lineas, 0.2)).toEqual({
			subtotal: 59.75,
			descuentoItems: 0.3,
			descuento: 0.2,
			total: 59.55,
			unidades: 5
		});
	});

	it('el descuento global nunca supera el subtotal', () => {
		expect(calcularTotales([linea()], 100).total).toBe(0);
	});

	it('con recalcular usa el precio de hoy', () => {
		const l = linea({ precio_unitario: 25, precio_actual: 20, cantidad: 2 });
		expect(calcularLinea(l)).toBe(50);
		expect(calcularLinea(l, true)).toBe(40);
	});

	it('calcularCambio solo si se paga con lo suficiente', () => {
		expect(calcularCambio(80.5, '100')).toBe(19.5);
		expect(calcularCambio(80.5, '50')).toBeNull();
		expect(calcularCambio(80.5, '')).toBeNull();
	});
});

describe('carrito', () => {
	it('agrega una línea nueva con el precio vigente', () => {
		const result = agregarAlCarrito([], sku());
		expect(result.ok).toBe(true);
		expect(result.lineas).toHaveLength(1);
		expect(result.lineas[0]).toMatchObject({ precio_unitario: 19.95, stock: 3, cantidad: 1 });
	});

	it('suma a la línea existente sin superar el stock', () => {
		let lineas = agregarAlCarrito([], sku()).lineas;
		lineas = agregarAlCarrito(lineas, sku()).lineas;
		lineas = agregarAlCarrito(lineas, sku()).lineas;
		expect(lineas[0].cantidad).toBe(3);

		const result = agregarAlCarrito(lineas, sku());
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/Solo hay 3 unidades/);
		expect(result.lineas[0].cantidad).toBe(3);
	});

	it('no agrega un SKU agotado', () => {
		const result = agregarAlCarrito(
			[],
			sku({ stock: { cantidad: 0, minimo: 1, actualizado: '' } })
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/agotado/);
	});

	it('validarLinea marca cantidad sobre el stock, descuento mayor al precio y SKU eliminado', () => {
		expect(validarLinea(linea())).toEqual({});
		expect(validarLinea(linea({ cantidad: 6 })).cantidad).toMatch(/Solo hay 5/);
		expect(validarLinea(linea({ cantidad: 0 })).cantidad).toBeDefined();
		expect(validarLinea(linea({ descuento_unitario: '20' })).descuento).toMatch(/superar/);
		expect(validarLinea(linea({ descuento_unitario: 'abc' })).descuento).toBeDefined();
		expect(validarLinea(linea({ eliminado: true, stock: null })).linea).toMatch(/catálogo/);
		// Al recalcular, el descuento se compara con el precio de hoy
		expect(
			validarLinea(
				linea({ precio_unitario: 25, precio_actual: 10, descuento_unitario: '15' }),
				true
			).descuento
		).toBeDefined();
	});

	it('toItemsRequest convierte el descuento escrito', () => {
		expect(toItemsRequest([linea({ cantidad: 2, descuento_unitario: '1,5' })])).toEqual([
			{ sku_id: 's1', cantidad: 2, descuento_unitario: 1.5 }
		]);
	});

	it('lineasDesdeVenta conserva el precio ofrecido y marca lo que ya no existe', () => {
		const lineas = lineasDesdeVenta(venta, [sku({ precio_vigente: 22 })]);
		expect(lineas[0]).toMatchObject({ precio_unitario: 19.95, precio_actual: 22, stock: 3 });
		expect(lineas[0].eliminado).toBeUndefined();
		expect(lineas[1]).toMatchObject({ eliminado: true, stock: null, descuento_unitario: '5' });
		expect(hayPreciosDistintos(lineas)).toBe(true);
		expect(hayPreciosDistintos(lineasDesdeVenta(venta, [sku()]))).toBe(false);
	});
});

describe('sincronizarLineas', () => {
	it('actualiza stock y precio de hoy sin cambiar el precio cobrado', () => {
		const [l] = sincronizarLineas(
			[linea({ precio_unitario: 25 })],
			[sku({ precio_vigente: 22, stock: { cantidad: 1, minimo: 0, actualizado: '' } })]
		);
		expect(l).toMatchObject({ precio_unitario: 25, precio_actual: 22, stock: 1 });
	});
});

describe('inventario', () => {
	it('agrupa por producto y color en el orden recibido', () => {
		const grupos = agruparInventario([
			sku({ id: 'a' }),
			sku({ id: 'b', talla_etiqueta: 'L' }),
			sku({ id: 'c', color_id: 'c2', color_nombre: 'Blanco' }),
			sku({ id: 'd', producto_id: 'p2', producto_nombre: 'Pantalón' })
		]);
		expect(grupos.map((g) => g.producto_nombre)).toEqual(['Camisa Oxford', 'Pantalón']);
		expect(grupos[0].colores.map((c) => c.skus.map((s) => s.id))).toEqual([['a', 'b'], ['c']]);
	});

	it('descontarStock resta lo vendido sin bajar de 0', () => {
		const [a, b] = descontarStock(
			[sku(), sku({ id: 's2' })],
			[
				{ sku_id: 's1', cantidad: 2 },
				{ sku_id: 's1', cantidad: 5 }
			]
		);
		expect(a.stock.cantidad).toBe(0);
		expect(b.stock.cantidad).toBe(3);
	});
});

describe('whatsapp', () => {
	it('normaliza números bolivianos y con código de país', () => {
		expect(normalizarTelefonoWhatsapp('71234567')).toBe('59171234567');
		expect(normalizarTelefonoWhatsapp('+591 712-34567')).toBe('59171234567');
		expect(normalizarTelefonoWhatsapp('123')).toBeNull();
		expect(normalizarTelefonoWhatsapp(null)).toBeNull();
	});

	it('arma el mensaje con ítems y total', () => {
		const texto = mensajeWhatsappVenta(venta, 'Pinodo');
		expect(texto).toContain('*Pinodo*');
		expect(texto).toContain('Pedido #000012');
		expect(texto).toContain('2 × Camisa Oxford (Azul marino, talla M)');
		expect(texto).toContain('Descuento');
		expect(buildWhatsappUrl(venta)).toMatch(/^https:\/\/wa\.me\/59171234567\?text=/);
		expect(buildWhatsappUrl({ ...venta, cliente_telefono: null })).toMatch(
			/^https:\/\/wa\.me\/\?text=/
		);
	});
});

describe('fechas y permisos', () => {
	it('rangoFechas calcula desde/hasta incluidos', () => {
		expect(rangoFechas('HOY', '2026-11-10')).toEqual({ desde: '2026-11-10', hasta: '2026-11-10' });
		expect(rangoFechas('AYER', '2026-03-01')).toEqual({ desde: '2026-02-28', hasta: '2026-02-28' });
		expect(rangoFechas('SIETE_DIAS', '2026-11-03')).toEqual({
			desde: '2026-10-28',
			hasta: '2026-11-03'
		});
		expect(rangoFechas('MES', '2026-11-10')).toEqual({ desde: '2026-11-01', hasta: '2026-11-10' });
		expect(rangoFechas('TODO', '2026-11-10')).toEqual({});
		expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
	});

	it('ventaFiltrosToParams arma fechas, número y filtros', () => {
		const base = {
			rango: 'HOY' as const,
			desde: '',
			hasta: '',
			estado: null,
			canal: null,
			metodo_pago: null,
			numero: '',
			created_by: null
		};
		expect(ventaFiltrosToParams(base, '2026-11-10')).toMatchObject({
			desde: '2026-11-10',
			hasta: '2026-11-10',
			numero: undefined
		});
		expect(
			ventaFiltrosToParams(
				{
					...base,
					rango: 'PERSONALIZADO',
					desde: '2026-10-01',
					numero: '#000012',
					canal: 'TIENDA'
				},
				'2026-11-10'
			)
		).toMatchObject({ desde: '2026-10-01', hasta: undefined, numero: 12, canal: 'TIENDA' });
	});

	it('accionesVenta: el cajero gestiona pendientes pero no anula cobradas', () => {
		expect(accionesVenta({ estado: 'PENDIENTE' }, 'CAJERO')).toEqual({
			editar: true,
			cobrar: true,
			cancelar: true
		});
		expect(accionesVenta({ estado: 'CONFIRMADA' }, 'CAJERO').cancelar).toBe(false);
		expect(accionesVenta({ estado: 'CONFIRMADA' }, 'ADMIN').cancelar).toBe(true);
		expect(accionesVenta({ estado: 'CANCELADA' }, 'OWNER')).toEqual({
			editar: false,
			cobrar: false,
			cancelar: false
		});
		expect(accionesVenta({ estado: 'PENDIENTE' }, 'SUPERADMIN').cobrar).toBe(false);
	});
});
