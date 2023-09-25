export function childrenHasTag(el: Element, tagName: string): 'no' | 'one' | 'many' {
	let count = 0;
	for (const child of el.children) {
		if (child.tagName == tagName) count++;
		if (count > 1) return 'many';
	}
	if (count == 0) return 'no';
	return 'one';
}

export function measureDuration(tempo: number, nBeats: number) {
	return nBeats / (tempo / 60);
}

export function runSelectors(
	el: Element,
	selectors: [string[], (el: Element) => unknown][]
): boolean {
	let selectorAny = false;
	for (const [selector, handler] of selectors) {
		let match = true;
		for (const tag of selector) {
			if (tag.startsWith('!')) {
				if (el.querySelector(tag.slice(1))) {
					match = false;
					break;
				}
			} else {
				if (!el.querySelector(tag)) {
					match = false;
					break;
				}
			}
		}

		if (match) {
			handler(el);
			selectorAny = true;
		}
	}

	return selectorAny;
}
