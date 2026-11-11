import type {
	CestaItem,
	TiendaCategoriaNodo,
	TiendaFiltros,
	TiendaOrden,
	TiendaProductoDetalle,
	TiendaProductosQuery,
	TiendaRef,
	TiendaSeccion
} from '#lib/interfaces/index.ts';
import { formatCurrency } from './format';

// ── URLs con slug ─────────────────────────────────────────────────────────────────────────────
// Producto: /{slug}-p{id} · Categoría: /{slug}-l{id} · Sección: /{slug}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_RE = new RegExp(`^${UUID}$`, 'i');

export type TiendaUrlTipo = 'p' | 'l';

/** Segmento de URL de un producto (`p`) o una categoría (`l`): `vestido-midi-p{id}` */
export function slugIdParam(item: { slug: string; id: string }, tipo: TiendaUrlTipo): string {
	return `${item.slug}-${tipo}${item.id}`;
}

/** Separa slug e id de un segmento `{slug}-p{id}` / `{slug}-l{id}`; null si no tiene ese formato */
export function parseSlugId(
	param: string,
	tipo: TiendaUrlTipo
): { slug: string; id: string } | null {
	const match = new RegExp(`^(.+)-${tipo}(${UUID})$`, 'i').exec(param);
	return match ? { slug: match[1], id: match[2].toLowerCase() } : null;
}

export function isUuid(value: string): boolean {
	return UUID_RE.test(value);
}

// ── Navegación ────────────────────────────────────────────────────────────────────────────────

export interface CategoriaUbicacion {
	seccion: TiendaSeccion;
	/** Ruta desde la categoría raíz hasta la buscada (incluida) */
	ruta: TiendaRef[];
	nodo: TiendaCategoriaNodo;
}

/** Busca una categoría en el árbol de navegación; null si no está visible */
export function ubicarCategoria(
	navegacion: TiendaSeccion[],
	categoriaId: string
): CategoriaUbicacion | null {
	const buscar = (
		nodos: TiendaCategoriaNodo[],
		ruta: TiendaRef[]
	): { ruta: TiendaRef[]; nodo: TiendaCategoriaNodo } | null => {
		for (const nodo of nodos) {
			const actual = [...ruta, nodo.data];
			if (nodo.data.id === categoriaId) return { ruta: actual, nodo };
			const encontrado = buscar(nodo.children, actual);
			if (encontrado) return encontrado;
		}
		return null;
	};

	for (const seccion of navegacion) {
		const encontrado = buscar(seccion.categorias.data, []);
		if (encontrado) return { seccion, ...encontrado };
	}
	return null;
}

// ── Filtros en la URL ─────────────────────────────────────────────────────────────────────────

export const TIENDA_ORDENES: { value: TiendaOrden; label: string }[] = [
	{ value: 'NOVEDADES', label: 'Novedades' },
	{ value: 'PRECIO_ASC', label: 'Precio: menor a mayor' },
	{ value: 'PRECIO_DESC', label: 'Precio: mayor a menor' }
];

/** Parámetros de la URL que pertenecen a los filtros (se reemplazan al aplicar) */
const FILTRO_PARAMS = ['orden', 'color', 'talla', 'disponible', 'rebaja', 'min', 'max', 'page'];

export const TIENDA_PER_PAGE = 24;

function precioParam(value: string | null): number | null {
	if (value === null || value.trim() === '') return null;
	const number = Number(value);
	return Number.isFinite(number) && number >= 0 ? number : null;
}

export function filtrosVacios(): TiendaFiltros {
	return {
		orden: 'NOVEDADES',
		colores: [],
		tallas: [],
		disponible: false,
		rebaja: false,
		min: null,
		max: null
	};
}

/** Lee los filtros de la query string; descarta valores inválidos para no provocar un 422 */
export function parseFiltros(params: URLSearchParams): TiendaFiltros {
	const orden = params.get('orden');
	return {
		orden: TIENDA_ORDENES.some((o) => o.value === orden) ? (orden as TiendaOrden) : 'NOVEDADES',
		colores: [...new Set(params.getAll('color').filter(isUuid))],
		tallas: [...new Set(params.getAll('talla').filter(isUuid))],
		disponible: params.get('disponible') === '1',
		rebaja: params.get('rebaja') === '1',
		min: precioParam(params.get('min')),
		max: precioParam(params.get('max'))
	};
}

/** Escribe los filtros en la query string conservando el resto (p. ej. `q`); vuelve a la página 1 */
export function filtrosToSearchParams(
	filtros: TiendaFiltros,
	base: URLSearchParams | string = ''
): URLSearchParams {
	const params = new URLSearchParams(base);
	for (const key of FILTRO_PARAMS) params.delete(key);
	if (filtros.orden !== 'NOVEDADES') params.set('orden', filtros.orden);
	for (const color of filtros.colores) params.append('color', color);
	for (const talla of filtros.tallas) params.append('talla', talla);
	if (filtros.disponible) params.set('disponible', '1');
	if (filtros.rebaja) params.set('rebaja', '1');
	if (filtros.min !== null) params.set('min', String(filtros.min));
	if (filtros.max !== null) params.set('max', String(filtros.max));
	return params;
}

/** Filtros de la URL → query de `GET /tienda/productos` */
export function filtrosToQuery(filtros: TiendaFiltros): TiendaProductosQuery {
	return {
		orden: filtros.orden,
		color_id: filtros.colores,
		talla_id: filtros.tallas,
		disponible: filtros.disponible || undefined,
		en_rebaja: filtros.rebaja || undefined,
		precio_min: filtros.min ?? undefined,
		precio_max: filtros.max ?? undefined
	};
}

/** Cantidad de filtros aplicados (sin contar el orden) */
export function contarFiltros(filtros: TiendaFiltros): number {
	return (
		filtros.colores.length +
		filtros.tallas.length +
		Number(filtros.disponible) +
		Number(filtros.rebaja) +
		Number(filtros.min !== null || filtros.max !== null)
	);
}

/** Query string actual con otra página (para el enlace "Ver más") */
export function conPagina(search: string, pagina: number): string {
	const params = new URLSearchParams(search);
	params.set('page', String(pagina));
	return params.toString();
}

/** Página pedida en la URL (mínimo 1) */
export function paginaParam(params: URLSearchParams): number {
	const page = Number(params.get('page'));
	return Number.isInteger(page) && page > 1 ? page : 1;
}

// ── Imágenes ──────────────────────────────────────────────────────────────────────────────────

/**
 * URL de Cloudinary redimensionada y en el formato más liviano que acepte el navegador.
 * Las URLs que no son de Cloudinary (o ya traen transformación) se devuelven tal cual.
 */
export function imagenUrl(url: string | null | undefined, width: number): string | null {
	if (!url) return null;
	const marker = '/image/upload/';
	const index = url.indexOf(marker);
	if (index === -1 || !url.includes('res.cloudinary.com')) return url;
	const rest = url.slice(index + marker.length);
	// Ya transformada (p. ej. "w_400,c_fill/..."): no se toca
	if (/^[a-z]{1,3}_[^/]*\//.test(rest)) return url;
	return `${url.slice(0, index + marker.length)}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

/** `srcset` responsive para una imagen de producto */
export function imagenSrcset(url: string | null | undefined, widths = [400, 700, 1000, 1400]) {
	if (!imagenUrl(url, widths[0])?.includes('w_')) return undefined;
	return widths.map((w) => `${imagenUrl(url, w)} ${w}w`).join(', ');
}

// ── Cesta ─────────────────────────────────────────────────────────────────────────────────────

/** Unidades máximas de una misma prenda (talla y color) por pedido */
export const CESTA_MAX_CANTIDAD = 10;

function limitar(cantidad: number): number {
	return Math.min(CESTA_MAX_CANTIDAD, Math.max(0, Math.floor(cantidad)));
}

export function esCestaItem(value: unknown): value is CestaItem {
	if (typeof value !== 'object' || value === null) return false;
	const item = value as Partial<CestaItem>;
	return (
		typeof item.sku_id === 'string' &&
		typeof item.producto_id === 'string' &&
		typeof item.slug === 'string' &&
		typeof item.nombre === 'string' &&
		typeof item.color === 'string' &&
		typeof item.talla === 'string' &&
		typeof item.precio === 'number' &&
		typeof item.cantidad === 'number' &&
		item.cantidad > 0
	);
}

/** Agrega una prenda; si ya está (mismo SKU) suma la cantidad, con el tope por línea */
export function agregarACesta(items: CestaItem[], item: CestaItem): CestaItem[] {
	const existente = items.find((i) => i.sku_id === item.sku_id);
	if (!existente) return [...items, { ...item, cantidad: limitar(item.cantidad) || 1 }];
	return items.map((i) =>
		i.sku_id === item.sku_id
			? { ...item, cantidad: limitar(i.cantidad + item.cantidad), agotado: false }
			: i
	);
}

/** Cambia la cantidad de una línea; 0 o menos la quita */
export function cambiarCantidadCesta(
	items: CestaItem[],
	skuId: string,
	cantidad: number
): CestaItem[] {
	const nueva = limitar(cantidad);
	if (nueva === 0) return quitarDeCesta(items, skuId);
	return items.map((i) => (i.sku_id === skuId ? { ...i, cantidad: nueva } : i));
}

export function quitarDeCesta(items: CestaItem[], skuId: string): CestaItem[] {
	return items.filter((i) => i.sku_id !== skuId);
}

export function cantidadCesta(items: CestaItem[]): number {
	return items.reduce((total, i) => total + i.cantidad, 0);
}

/** Total con los precios guardados; las líneas agotadas no suman */
export function totalCesta(items: CestaItem[]): number {
	const total = items.reduce((sum, i) => (i.agotado ? sum : sum + i.precio * i.cantidad), 0);
	return Math.round(total * 100) / 100;
}

/**
 * Actualiza precio y disponibilidad de las líneas de un producto con su ficha recién consultada.
 * Devuelve el mismo array si nada cambió.
 */
export function sincronizarCesta(items: CestaItem[], producto: TiendaProductoDetalle): CestaItem[] {
	const skus = new Map(producto.colores.flatMap((c) => c.skus.map((s) => [s.id, s] as const)));
	let cambio = false;
	const actualizados = items.map((item) => {
		if (item.producto_id !== producto.id) return item;
		const sku = skus.get(item.sku_id);
		const precio = sku?.precio_vigente ?? item.precio;
		const precioNormal = sku?.precio_normal ?? item.precio_normal;
		const agotado = !sku?.disponible;
		if (
			precio === item.precio &&
			precioNormal === item.precio_normal &&
			agotado === Boolean(item.agotado) &&
			producto.slug === item.slug &&
			producto.nombre === item.nombre
		) {
			return item;
		}
		cambio = true;
		return {
			...item,
			precio,
			precio_normal: precioNormal,
			agotado,
			slug: producto.slug,
			nombre: producto.nombre
		};
	});
	return cambio ? actualizados : items;
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────────────────────

/** Enlace `wa.me` con el mensaje; null si el número no tiene dígitos */
export function whatsappUrl(numero: string | null | undefined, texto?: string): string | null {
	const digitos = (numero ?? '').replace(/\D/g, '');
	if (!digitos) return null;
	return `https://wa.me/${digitos}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

/**
 * Mensaje que un cliente le envía a la tienda cuando el sitio está en mantenimiento. Está escrito en
 * la voz del cliente (puede editarlo antes de enviar) y le muestra al dueño que hay compradores
 * reales esperando, para motivarlo a reactivar la tienda en línea.
 */
export function mensajeMantenimiento(tienda: string): string {
	return [
		`¡Hola, ${tienda}! 👋`,
		'Entré a su tienda en línea porque quería ver sus productos y comprar, pero aparece en mantenimiento y no pude ver el catálogo. 😕',
		'Me gustaría hacerles un pedido: ¿pueden reactivarla pronto? Así más clientes como yo podemos comprarles desde el celular sin esperar.',
		'¡Muchas gracias y mucho éxito! 🛍️'
	].join('\n\n');
}

export interface PedidoWhatsappOptions {
	tienda: string;
	/** Origen del sitio para armar los enlaces a cada producto (p. ej. https://mitienda.com) */
	origin: string;
	nombre?: string;
	nota?: string;
}

/** Mensaje del pedido para enviar por WhatsApp; las líneas agotadas se omiten */
export function mensajePedido(items: CestaItem[], options: PedidoWhatsappOptions): string {
	const disponibles = items.filter((i) => !i.agotado);
	const lineas = disponibles.map((item, index) => {
		const url = `${options.origin}/${slugIdParam({ slug: item.slug, id: item.producto_id }, 'p')}`;
		return [
			`${index + 1}. *${item.nombre}*`,
			`   Color: ${item.color} · Talla: ${item.talla}`,
			`   ${item.cantidad} × ${formatCurrency(item.precio)} = ${formatCurrency(item.precio * item.cantidad)}`,
			`   ${url}`
		].join('\n');
	});

	const partes = [
		`¡Hola, ${options.tienda}! Quiero hacer este pedido:`,
		lineas.join('\n\n'),
		`*Total: ${formatCurrency(totalCesta(disponibles))}* (${cantidadCesta(disponibles)} ${
			cantidadCesta(disponibles) === 1 ? 'prenda' : 'prendas'
		})`
	];
	const nombre = options.nombre?.trim();
	const nota = options.nota?.trim();
	if (nombre) partes.push(`Nombre: ${nombre}`);
	if (nota) partes.push(`Nota: ${nota}`);
	partes.push('Quedo atento(a) a la confirmación de disponibilidad y precio. ¡Gracias!');
	return partes.join('\n\n');
}
