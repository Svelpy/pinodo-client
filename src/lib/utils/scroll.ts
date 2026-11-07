/** Ancestro más cercano que hace scroll por sí mismo; si no hay, el de la página */
function getScrollParent(element: HTMLElement): HTMLElement | null {
	for (let parent = element.parentElement; parent; parent = parent.parentElement) {
		const { overflowY } = getComputedStyle(parent);
		const scrolls = overflowY === 'auto' || overflowY === 'scroll';
		if (scrolls && parent.scrollHeight > parent.clientHeight) return parent;
	}
	return document.scrollingElement as HTMLElement | null;
}

/**
 * Lleva el elemento al centro de su contenedor con scroll.
 *
 * Se usa en lugar de `element.scrollIntoView()`: ese método desplaza también los ancestros con
 * `overflow: hidden`, y el layout del panel los usa para fijar la tarjeta principal en pantalla, así
 * que `scrollIntoView` la descolocaba. Aquí solo se mueve el contenedor que realmente hace scroll.
 */
export function scrollToCenter(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
	const container = getScrollParent(element);
	if (!container) return;

	const isPage = container === document.scrollingElement;
	const viewport = isPage
		? { top: 0, height: window.innerHeight }
		: container.getBoundingClientRect();
	const target = element.getBoundingClientRect();

	const offset = target.top - viewport.top - (viewport.height - target.height) / 2;
	container.scrollTo({ top: container.scrollTop + offset, behavior });
}
