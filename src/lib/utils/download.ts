/** Ofrece guardar un archivo generado en el navegador (p. ej. un Excel descargado de la API) */
export function descargarArchivo(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.rel = 'noopener';
	document.body.append(link);
	link.click();
	link.remove();
	// Se libera después del clic: algunos navegadores leen la URL de forma asíncrona
	setTimeout(() => URL.revokeObjectURL(url), 0);
}
