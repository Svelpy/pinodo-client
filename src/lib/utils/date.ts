/** Fecha de hoy en formato YYYY-MM-DD (hora local) */
export function todayISO(): string {
	return new Date().toLocaleDateString('en-CA');
}

/** Última fecha de nacimiento (YYYY-MM-DD) con la que hoy se tienen al menos `years` años */
export function latestBirthDateForAge(years: number): string {
	const [year, month, day] = todayISO().split('-');
	return `${Number(year) - years}-${month}-${day}`;
}
