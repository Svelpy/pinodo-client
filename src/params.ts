import { defineParams } from '@sveltejs/kit/params';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const PRODUCTO = new RegExp(`^.+-p${UUID}$`, 'i');
const CATEGORIA = new RegExp(`^.+-l${UUID}$`, 'i');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Segmentos de las URLs de la tienda pública */
export const params = defineParams({
	/** `/{slug}-p{uuid}`: ficha de producto */
	producto: (param) => (PRODUCTO.test(param) ? param : undefined),
	/** `/{slug}-l{uuid}`: listado de una categoría */
	categoria: (param) => (CATEGORIA.test(param) ? param : undefined),
	/** `/{slug}`: sección (mujer, hombre…), excluye los segmentos de producto y categoría */
	seccion: (param) =>
		SLUG.test(param) && !PRODUCTO.test(param) && !CATEGORIA.test(param) ? param : undefined
});
