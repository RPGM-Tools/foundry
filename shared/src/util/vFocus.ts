import type { Directive } from 'vue';

export const vFocus: Directive<HTMLElement, string | undefined> = {
	mounted(el, { value }) {
		const target: HTMLElement | null = value ? el.querySelector(value) : el;
		setTimeout(() => target?.focus(), 500);
	}
};
