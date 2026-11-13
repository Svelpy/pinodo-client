import { describe, expect, it } from 'vitest';
import { validateSchemaDeep } from '#lib/utils/index.ts';
import {
	createVentaCheckoutSchema,
	createVentaConfirmarSchema,
	VENTA_LIMITS
} from './venta.schema';

const pago = (metodo: string | null, monto = '', referencia = '') => ({
	id: Math.random().toString(36),
	metodo,
	monto,
	referencia
});

const base = {
	canal: 'TIENDA',
	referencia: '',
	cliente_telefono: '',
	descuento: '',
	nota: '',
	pagos: [pago('EFECTIVO')]
};

describe('createVentaCheckoutSchema', () => {
	it('convierte los opcionales vacíos en null y un pago único cubre el total', () => {
		const result = validateSchemaDeep(
			createVentaCheckoutSchema({ cobrar: true, subtotal: 100, total: 100 }),
			base
		);
		expect(result).toEqual({
			success: true,
			data: {
				canal: 'TIENDA',
				referencia: null,
				cliente_telefono: null,
				descuento: 0,
				nota: null,
				pagos: [{ metodo: 'EFECTIVO', monto: 100 }]
			}
		});
	});

	it('acepta los canales nuevos', () => {
		const schema = createVentaCheckoutSchema({ cobrar: false, subtotal: 10, total: 10 });
		for (const canal of ['TIKTOK_LIVE', 'INSTAGRAM', 'PAGINA_WEB', 'OTROS']) {
			expect(validateSchemaDeep(schema, { ...base, canal }).success).toBe(true);
		}
	});

	it('exige el método solo al cobrar; un pedido se guarda sin pagos', () => {
		const sinMetodo = { ...base, pagos: [pago(null)] };
		const cobrar = validateSchemaDeep(
			createVentaCheckoutSchema({ cobrar: true, subtotal: 10, total: 10 }),
			sinMetodo
		);
		expect(cobrar.success).toBe(false);
		if (!cobrar.success) expect(cobrar.errors['pagos.0.metodo']).toMatch(/método de pago/);

		const pedido = validateSchemaDeep(
			createVentaCheckoutSchema({ cobrar: false, subtotal: 10, total: 10 }),
			{ ...base, pagos: [pago('QR', '', '123')] }
		);
		expect(pedido.success && pedido.data.pagos).toEqual([]);
	});

	it('acepta coma decimal y no permite un descuento mayor al subtotal', () => {
		const schema = createVentaCheckoutSchema({ cobrar: false, subtotal: 84.8, total: 84.8 });
		const ok = validateSchemaDeep(schema, { ...base, descuento: '4,80' });
		expect(ok.success && ok.data.descuento).toBe(4.8);

		const igual = validateSchemaDeep(schema, { ...base, descuento: '84.80' });
		expect(igual.success).toBe(true);

		const mayor = validateSchemaDeep(schema, { ...base, descuento: '84.81' });
		expect(mayor.success).toBe(false);
		if (!mayor.success) expect(mayor.errors.descuento).toMatch(/subtotal/);

		const invalido = validateSchemaDeep(schema, { ...base, descuento: '1.234' });
		expect(invalido.success).toBe(false);
	});

	it('valida el teléfono y los largos máximos', () => {
		const schema = createVentaCheckoutSchema({ cobrar: false, subtotal: 10, total: 10 });
		expect(validateSchemaDeep(schema, { ...base, cliente_telefono: '+591 71234567' }).success).toBe(
			true
		);
		expect(validateSchemaDeep(schema, { ...base, cliente_telefono: '7123' }).success).toBe(false);
		expect(validateSchemaDeep(schema, { ...base, cliente_telefono: 'abc12345' }).success).toBe(
			false
		);
		expect(
			validateSchemaDeep(schema, { ...base, nota: 'x'.repeat(VENTA_LIMITS.NOTA_MAX + 1) }).success
		).toBe(false);
		expect(
			validateSchemaDeep(schema, {
				...base,
				referencia: 'x'.repeat(VENTA_LIMITS.REFERENCIA_MAX + 1)
			}).success
		).toBe(false);
	});
});

describe('pagos mixtos', () => {
	const schema = createVentaConfirmarSchema(80);

	it('deben sumar exactamente el total, con coma decimal', () => {
		const ok = validateSchemaDeep(schema, {
			pagos: [pago('QR', '50,50', ' 0048213 '), pago('EFECTIVO', '29.50')]
		});
		expect(ok).toEqual({
			success: true,
			data: {
				pagos: [
					{ metodo: 'QR', monto: 50.5, referencia: '0048213' },
					{ metodo: 'EFECTIVO', monto: 29.5 }
				]
			}
		});

		const falta = validateSchemaDeep(schema, { pagos: [pago('QR', '50'), pago('EFECTIVO', '20')] });
		expect(falta.success).toBe(false);
		if (!falta.success) expect(falta.errors.pagos).toMatch(/^Faltan/);

		const sobra = validateSchemaDeep(schema, { pagos: [pago('QR', '50'), pago('EFECTIVO', '40')] });
		expect(sobra.success).toBe(false);
		if (!sobra.success) expect(sobra.errors.pagos).toMatch(/^Sobran/);
	});

	it('cada pago necesita método y un monto mayor que 0', () => {
		const result = validateSchemaDeep(schema, { pagos: [pago(null, '80'), pago('QR', '0')] });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors['pagos.0.metodo']).toBeDefined();
			expect(result.errors['pagos.1.monto']).toMatch(/mayor que 0/);
		}
		const vacio = validateSchemaDeep(schema, { pagos: [pago('QR', '80'), pago('QR', '')] });
		expect(!vacio.success && vacio.errors['pagos.1.monto']).toMatch(/Ingresa el monto/);
	});

	it('exige al menos un pago y limita cuántos', () => {
		expect(validateSchemaDeep(schema, { pagos: [] }).success).toBe(false);
		const muchos = Array.from({ length: VENTA_LIMITS.PAGOS_MAX + 1 }, () => pago('QR', '1'));
		expect(validateSchemaDeep(schema, { pagos: muchos }).success).toBe(false);
	});
});
