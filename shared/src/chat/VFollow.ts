import type { Directive } from 'vue';

function attachBeforeTarget(el: HTMLElement, targetSelector: string) {
	const target = document.querySelector(targetSelector);
	if (!target) return;

	const newParent = target.parentElement;
	if (!newParent) return;
	if (newParent === el.parentElement && el.nextSibling === target) return;

	newParent.insertBefore(el, target);
}

/** Custom directive for following an html element based on a css selector, inserting itself before the target */
export const vFollow: Directive<
	HTMLElement & { _observer?: MutationObserver; _parent?: HTMLElement },
	string
> = {
	mounted(el, { value: targetSelector }) {
		el._parent = el.parentElement!;
		attachBeforeTarget(el, targetSelector);

		const observer = new MutationObserver(() => {
			attachBeforeTarget(el, targetSelector);
		});
		const interfaceEl = document.querySelector('#interface');
		if (!interfaceEl) return;
		observer.observe(interfaceEl, { childList: true, subtree: true });
		el._observer = observer;
	},
	unmounted(el) {
		el._observer?.disconnect();
	}
};
