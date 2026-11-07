export type ClickOutsideOptions =
	| (() => void)
	| {
			callback: () => void;
			exclude?: (HTMLElement | undefined)[] | HTMLElement;
	  };

export function clickOutside(node: HTMLElement, options: ClickOutsideOptions) {
	const handleClick = (event: MouseEvent) => {
		const callback = typeof options === 'function' ? options : options.callback;
		const exclude =
			typeof options === 'function'
				? []
				: Array.isArray(options.exclude)
					? options.exclude
					: [options.exclude];

		const target = event.target as Node;

		if (node && !node.contains(target)) {
			const isExcluded = exclude.some((el) => el && (el === target || el.contains(target)));
			if (!isExcluded) {
				callback();
			}
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
