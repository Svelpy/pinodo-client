const EAN13_REGEX = /^\d{13}$/;

/** Dígito de control de un EAN-13 a partir de sus 12 primeros dígitos (pesos 1 y 3 alternados) */
export function ean13CheckDigit(base12: string): number {
	const sum = [...base12].reduce(
		(total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3),
		0
	);
	return (10 - (sum % 10)) % 10;
}

/** true si son 13 dígitos con el dígito de control correcto */
export function isEan13(code: string): boolean {
	return EAN13_REGEX.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

/**
 * Siguiente EAN-13 válido: suma 1 a los 12 primeros dígitos (conservando el largo) y recalcula el
 * dígito de control. Sirve para no repetir en un mismo formulario la sugerencia de la API, que no
 * reserva códigos. La unicidad real la valida la API al guardar.
 */
export function nextEan13(code: string): string {
	const base = (BigInt(code.slice(0, 12)) + 1n).toString().padStart(12, '0').slice(-12);
	return `${base}${ean13CheckDigit(base)}`;
}

/** El primer código desde `code` (incluido) que no esté en `used` */
export function firstFreeEan13(code: string, used: ReadonlySet<string>): string {
	let candidate = code;
	while (used.has(candidate)) candidate = nextEan13(candidate);
	return candidate;
}
