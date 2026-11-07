import { IMAGEN_LIMITS } from '#lib/constants/index.ts';

const MAX_MB = IMAGEN_LIMITS.MAX_BYTES / (1024 * 1024);

/**
 * Comprueba en el navegador lo que la API rechazaría después: que sea una imagen, que no sea SVG y
 * que no pese más de 5 MB. Devuelve el mensaje de error, o `null` si el archivo es válido.
 */
export function validateImagenFile(file: Pick<File, 'name' | 'size' | 'type'>): string | null {
	const isSvg = file.type === 'image/svg+xml' || /\.svgz?$/i.test(file.name);
	if (isSvg) return 'No se admiten imágenes SVG.';
	if (!file.type.startsWith('image/')) return 'El archivo debe ser una imagen.';
	if (file.size > IMAGEN_LIMITS.MAX_BYTES) return `La imagen no puede pesar más de ${MAX_MB} MB.`;
	return null;
}
