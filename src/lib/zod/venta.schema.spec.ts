import { describe, expect, it } from 'vitest';
import { validateSchema } from '#lib/utils/index.ts';
import { createVentaCheckoutSchema, VENTA_LIMITS } from './venta.schema';

const base = {
	canal: 'TIENDA',
	metodo_pago: 'EFECTIVO',
	referencia: '',
	cliente_telefono: '',
	descuento: '',
	nota: ''
};

describe('createVentaCheckoutSchema', () => {
	it('convierte los opcionales vacíos en null y el descuento vacío en 0', () => {
		const result = validateSchema(createVentaCheckoutSchema({ cobrar: true, subtotal: 100 }), base);
		expect(result).toEqual({
			success: true,
			data: {
				canal: 'TIENDA',
				metodo_pago: 'EFECTIVO',
				referencia: null,
				cliente_telefono: null,
				descuento: 0,
				nota: null
			}
		});
	});

	it('exige el método de pago solo al cobrar', () => {
		const sinMetodo = { ...base, metodo_pago: null };
		const cobrar = validateSchema(
			createVentaCheckoutSchema({ cobrar: true, subtotal: 10 }),
			sinMetodo
		);
		expect(cobrar.success).toBe(false);
		if (!cobrar.success) expect(cobrar.errors.metodo_pago).toMatch(/método de pago/);

		const pedido = validateSchema(
			createVentaCheckoutSchema({ cobrar: false, subtotal: 10 }),
			sinMetodo
		);
		expect(pedido.success).toBe(true);
	});

	it('acepta coma decimal y no permite un descuento mayor al subtotal', () => {
		const schema = createVentaCheckoutSchema({ cobrar: false, subtotal: 84.8 });
		const ok = validateSchema(schema, { ...base, descuento: '4,80' });
		expect(ok.success && ok.data.descuento).toBe(4.8);

		const igual = validateSchema(schema, { ...base, descuento: '84.80' });
		expect(igual.success).toBe(true);

		const mayor = validateSchema(schema, { ...base, descuento: '84.81' });
		expect(mayor.success).toBe(false);
		if (!mayor.success) expect(mayor.errors.descuento).toMatch(/subtotal/);

		const invalido = validateSchema(schema, { ...base, descuento: '1.234' });
		expect(invalido.success).toBe(false);
	});

	it('valida el teléfono y los largos máximos', () => {
		const schema = createVentaCheckoutSchema({ cobrar: false, subtotal: 10 });
		expect(validateSchema(schema, { ...base, cliente_telefono: '+591 71234567' }).success).toBe(
			true
		);
		expect(validateSchema(schema, { ...base, cliente_telefono: '7123' }).success).toBe(false);
		expect(validateSchema(schema, { ...base, cliente_telefono: 'abc12345' }).success).toBe(false);
		expect(
			validateSchema(schema, { ...base, nota: 'x'.repeat(VENTA_LIMITS.NOTA_MAX + 1) }).success
		).toBe(false);
		expect(
			validateSchema(schema, { ...base, referencia: 'x'.repeat(VENTA_LIMITS.REFERENCIA_MAX + 1) })
				.success
		).toBe(false);
	});
});
