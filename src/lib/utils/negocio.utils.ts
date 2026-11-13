import { DIAS_SEMANA } from '#lib/constants/index.ts';
import type {
	Tienda,
	TiendaFormValues,
	TiendaImagenForm,
	UpdateTiendaRequest
} from '#lib/interfaces/index.ts';
import type { TiendaFormData } from '#lib/zod/index.ts';

/** Horas que se proponen al abrir un día que estaba cerrado */
export const HORARIO_DEFAULT = { apertura: '09:00', cierre: '18:00' } as const;

/** Valores iniciales del formulario "Mi negocio" a partir de la configuración guardada */
export function toTiendaForm(tienda: Tienda): TiendaFormValues {
	const horario = tienda.horario ?? {};
	return {
		nombre_tienda: tienda.nombre_tienda,
		descripcion: tienda.descripcion ?? '',
		email_contacto: tienda.email_contacto ?? '',
		telefono: tienda.telefono ?? '',
		whatsapp: tienda.whatsapp ?? '',
		direccion: tienda.direccion ?? '',
		map_url: tienda.map_url ?? '',
		ciudad: tienda.ciudad ?? '',
		// Los 7 días siempre, en orden: un día ausente en la API está cerrado
		horario: DIAS_SEMANA.map((dia) => {
			const [apertura, cierre] = horario[dia]?.split('-') ?? [];
			return {
				dia,
				abierto: dia in horario,
				apertura: apertura ?? HORARIO_DEFAULT.apertura,
				cierre: cierre ?? HORARIO_DEFAULT.cierre
			};
		}),
		redes_sociales: Object.entries(tienda.redes_sociales ?? {}).map(([red, url]) => ({ red, url }))
	};
}

/**
 * Huella del formulario para saber si hay cambios sin guardar. Ignora lo que no cambia lo que se
 * enviaría: las horas de un día cerrado, los espacios en los extremos y las filas de redes vacías.
 */
export function tiendaFormSignature(values: TiendaFormValues): string {
	const { horario, redes_sociales, ...textos } = values;
	return JSON.stringify({
		...Object.fromEntries(
			Object.entries(textos).map(([key, value]) => [
				key,
				typeof value === 'string' ? value.trim() : value
			])
		),
		horario: horario.map((dia) => (dia.abierto ? `${dia.apertura}-${dia.cierre}` : null)),
		redes_sociales: redes_sociales
			.map(({ red, url }) => [red.trim().toLowerCase(), url.trim()])
			.filter(([red, url]) => red || url)
	});
}

/** Mismo contenido sin importar el orden de las claves */
function sameRecord(a: Record<string, string> | null, b: Record<string, string> | null): boolean {
	const entriesA = Object.entries(a ?? {});
	const recordB = b ?? {};
	return (
		entriesA.length === Object.keys(recordB).length &&
		entriesA.every(([key, value]) => recordB[key] === value)
	);
}

const TEXTOS = [
	'descripcion',
	'email_contacto',
	'telefono',
	'whatsapp',
	'direccion',
	'map_url',
	'ciudad'
] as const;

/** Body del PATCH: solo lo que difiere de la configuración guardada */
export function buildTiendaPatch(
	tienda: Tienda,
	data: TiendaFormData,
	imagenes: { logo: TiendaImagenForm; favicon: TiendaImagenForm }
): UpdateTiendaRequest {
	const patch: UpdateTiendaRequest = {};

	if (data.nombre_tienda !== tienda.nombre_tienda) patch.nombre_tienda = data.nombre_tienda;
	for (const key of TEXTOS) {
		if (data[key] !== (tienda[key] ?? null)) patch[key] = data[key];
	}
	if (!sameRecord(data.horario, tienda.horario)) patch.horario = data.horario;
	if (!sameRecord(data.redes_sociales, tienda.redes_sociales)) {
		patch.redes_sociales = data.redes_sociales;
	}

	// Un archivo nuevo ya reemplaza al anterior; quitar solo tiene sentido si hay uno guardado
	if (imagenes.logo.file) patch.logo = imagenes.logo.file;
	else if (imagenes.logo.eliminar && tienda.logo_url) patch.eliminar_logo = true;
	if (imagenes.favicon.file) patch.favicon = imagenes.favicon.file;
	else if (imagenes.favicon.eliminar && tienda.favicon_url) patch.eliminar_favicon = true;

	return patch;
}
