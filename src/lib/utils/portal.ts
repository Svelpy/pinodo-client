export function portal(node: HTMLElement, target: string | HTMLElement = 'body') {
	let targetElement: HTMLElement | null;

	async function update(newTarget: string | HTMLElement) {
		if (typeof newTarget === 'string') {
			targetElement = document.querySelector(newTarget);
			if (!targetElement) {
				throw new Error(`No element found matching selector: ${newTarget}`);
			}
		} else {
			targetElement = newTarget;
		}

		targetElement.appendChild(node);
		node.hidden = false;
	}

	update(target);

	return {
		update,
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		}
	};
}
