/**
 * Returns the first element of a jQuery object.
 * Used for compatibility with older versions of Foundry.
 */
export function j(el: JQuery<HTMLElement> | HTMLElement): HTMLElement {
	return el instanceof HTMLElement ? el : el[0] as HTMLElement;
}
