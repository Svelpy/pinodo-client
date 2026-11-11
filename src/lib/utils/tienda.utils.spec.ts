import { describe, expect, it } from 'vitest';
import type { CestaItem, TiendaProductoDetalle, TiendaSeccion } from '#lib/interfaces/index.ts';
import { formatCurrency } from './format';
import {
	agregarACesta,
	cambiarCantidadCesta,
	CESTA_MAX_CANTIDAD,
	contarFiltros,
	filtrosToQuery,
	filtrosToSearchParams,
	imagenUrl,
	mensajeMantenimiento,
	mensajePedido,
	paginaParam,
	parseFiltros,
	parseSlugId,
	sincronizarCesta,
	slugIdParam,
	totalCesta,
	ubicarCategoria,
	whatsappUrl
} from './tienda.utils';

const ID = '22222222-2222-4222-8222-222222222222';
const COLOR = '66666666-6666-4666-8666-666666666666';
const TALLA = '77777777-7777-4777-8777-777777777777';

const item = (overrides: Partial<CestaItem> = {}): CestaItem => ({
	sku_id: 'sku-1',
	producto_id: ID,
	slug: 'vestido-midi',
	nombre: 'Vestido midi',
	color: 'Negro',
	color_id: COLOR,
	talla: 'M',
	precio: 19.95,
	precio_normal: 29.95,
	imagen: null,
	cantidad: 1,
	...overrides
});

describe('URLs con slug', () => {
	it('arma y separa {slug}-p{id} y {slug}-l{id}', () => {
		const param = slugIdParam({ slug: 'vestido-midi', id: ID }, 'p');
		expect(param).toBe(`vestido-midi-p${ID}`);
		expect(parseSlugId(param, 'p')).toEqual({ slug: 'vestido-midi', id: ID });
		expect(parseSlugId(`mujer-vestidos-l${ID}`, 'l')).toEqual({ slug: 'mujer-vestidos', id: ID });
	});

	it('rechaza otro tipo o un id inválido', () => {
		expect(parseSlugId(`vestido-p${ID}`, 'l')).toBeNull();
		expect(parseSlugId('vestido-p123', 'p')).toBeNull();
		expect(parseSlugId(`-p${ID}`, 'p')).toBeNull();
	});
});

describe('ubicarCategoria', () => {
	const navegacion: TiendaSeccion[] = [
		{
			id: 's1',
			nombre: 'Mujer',
			slug: 'mujer',
			categorias: {
				total: 1,
				data: [
					{
						data: { id: 'c1', nombre: 'Vestidos', slug: 'mujer-vestidos' },
						children: [
							{ data: { id: 'c2', nombre: 'Midi', slug: 'mujer-vestidos-midi' }, children: [] }
						]
					}
				]
			}
		}
	];

	it('devuelve la sección y la ruta de ancestros', () => {
		const ubicacion = ubicarCategoria(navegacion, 'c2');
		expect(ubicacion?.seccion.slug).toBe('mujer');
		expect(ubicacion?.ruta.map((c) => c.id)).toEqual(['c1', 'c2']);
	});

	it('null si no está visible', () => {
		expect(ubicarCategoria(navegacion, 'nope')).toBeNull();
	});
});

describe('filtros en la URL', () => {
	it('parsea y descarta valores inválidos', () => {
		const filtros = parseFiltros(
			new URLSearchParams(
				`orden=PRECIO_ASC&color=${COLOR}&color=malo&talla=${TALLA}&rebaja=1&min=10&max=-3`
			)
		);
		expect(filtros).toEqual({
			orden: 'PRECIO_ASC',
			colores: [COLOR],
			tallas: [TALLA],
			disponible: false,
			rebaja: true,
			min: 10,
			max: null
		});
		expect(contarFiltros(filtros)).toBe(4);
	});

	it('orden desconocido vuelve a NOVEDADES', () => {
		expect(parseFiltros(new URLSearchParams('orden=X')).orden).toBe('NOVEDADES');
	});

	it('escribe los filtros conservando q y quitando la página', () => {
		const filtros = parseFiltros(new URLSearchParams(`color=${COLOR}&disponible=1`));
		const params = filtrosToSearchParams(filtros, new URLSearchParams('q=vestido&page=3&min=5'));
		expect(params.toString()).toBe(`q=vestido&color=${COLOR}&disponible=1`);
	});

	it('convierte a la query de la API', () => {
		const query = filtrosToQuery(parseFiltros(new URLSearchParams(`talla=${TALLA}&max=50`)));
		expect(query).toMatchObject({ talla_id: [TALLA], precio_max: 50, disponible: undefined });
	});

	it('paginaParam', () => {
		expect(paginaParam(new URLSearchParams('page=3'))).toBe(3);
		expect(paginaParam(new URLSearchParams('page=abc'))).toBe(1);
		expect(paginaParam(new URLSearchParams())).toBe(1);
	});
});

describe('imagenUrl', () => {
	it('agrega transformación a Cloudinary', () => {
		expect(imagenUrl('https://res.cloudinary.com/demo/image/upload/v1/a.jpg', 400)).toBe(
			'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_400/v1/a.jpg'
		);
	});

	it('no toca URLs transformadas ni de otros dominios', () => {
		const transformada = 'https://res.cloudinary.com/demo/image/upload/w_100/a.jpg';
		expect(imagenUrl(transformada, 400)).toBe(transformada);
		expect(imagenUrl('https://cdn.test/a.jpg', 400)).toBe('https://cdn.test/a.jpg');
		expect(imagenUrl(null, 400)).toBeNull();
	});
});

describe('cesta', () => {
	it('agrega, suma por SKU y respeta el tope', () => {
		let items = agregarACesta([], item());
		items = agregarACesta(items, item({ cantidad: 2 }));
		expect(items).toHaveLength(1);
		expect(items[0].cantidad).toBe(3);

		items = agregarACesta(items, item({ cantidad: 50 }));
		expect(items[0].cantidad).toBe(CESTA_MAX_CANTIDAD);
	});

	it('cambiar a 0 quita la línea', () => {
		const items = cambiarCantidadCesta([item(), item({ sku_id: 'sku-2' })], 'sku-1', 0);
		expect(items.map((i) => i.sku_id)).toEqual(['sku-2']);
	});

	it('el total redondea e ignora agotados', () => {
		expect(
			totalCesta([item({ cantidad: 3 }), item({ sku_id: 'x', precio: 10, agotado: true })])
		).toBe(59.85);
	});

	it('sincroniza precio y disponibilidad con la ficha', () => {
		const producto = {
			id: ID,
			slug: 'vestido-midi',
			nombre: 'Vestido midi',
			colores: [
				{
					skus: [
						{
							id: 'sku-1',
							precio_vigente: 15,
							precio_normal: 29.95,
							disponible: false
						}
					]
				}
			]
		} as unknown as TiendaProductoDetalle;

		const original = [item(), item({ sku_id: 'otro', producto_id: 'otro' })];
		const actualizados = sincronizarCesta(original, producto);
		expect(actualizados[0]).toMatchObject({ precio: 15, agotado: true });
		expect(actualizados[1]).toBe(original[1]);
		expect(sincronizarCesta(actualizados, producto)).toBe(actualizados);
	});
});

describe('WhatsApp', () => {
	it('whatsappUrl deja solo dígitos', () => {
		expect(whatsappUrl('+591 712-34567', 'hola mundo')).toBe(
			'https://wa.me/59171234567?text=hola%20mundo'
		);
		expect(whatsappUrl(null)).toBeNull();
		expect(whatsappUrl('---')).toBeNull();
	});

	it('mensajePedido lista prendas, enlaces y total', () => {
		const mensaje = mensajePedido(
			[item({ cantidad: 2 }), item({ sku_id: 'x', nombre: 'Agotado', agotado: true })],
			{ tienda: 'Tienda Moda', origin: 'https://tienda.test', nombre: ' Ana ', nota: '' }
		);
		expect(mensaje).toContain('¡Hola, Tienda Moda!');
		expect(mensaje).toContain('1. *Vestido midi*');
		expect(mensaje).toContain('Color: Negro · Talla: M');
		expect(mensaje).toContain(`https://tienda.test/vestido-midi-p${ID}`);
		expect(mensaje).toContain(`*Total: ${formatCurrency(39.9)}* (2 prendas)`);
		expect(mensaje).toContain('Nombre: Ana');
		expect(mensaje).not.toContain('Agotado');
		expect(mensaje).not.toContain('Nota:');
	});

	it('mensajeMantenimiento va en voz del cliente y pide reactivar la tienda', () => {
		const mensaje = mensajeMantenimiento('Tienda Moda');
		expect(mensaje).toContain('¡Hola, Tienda Moda!');
		expect(mensaje).toContain('mantenimiento');
		expect(mensaje).toContain('reactivarla');
		// Se puede codificar en un enlace wa.me sin perder el texto
		const url = whatsappUrl('+591 712-34567', mensaje);
		expect(decodeURIComponent(url?.split('?text=')[1] ?? '')).toBe(mensaje);
	});
});
