import type { Directive } from "vue";

/** Custom directive for following an html element based on a css selector, inserting itself before the target */
export const vFollow: Directive<HTMLElement & { _observer?: MutationObserver, _parent?: HTMLElement }, string> = {
	mounted(el, { value: targetSelector }) {
		el._parent = el.parentElement!;
		const observer = new MutationObserver(() => {
			const target = document.querySelector(targetSelector);
			if (!target) return;
			const newParent = target.parentElement;
			if (newParent !== el.parentElement) {
				newParent?.insertBefore(el, target);
			}
		});
		const interfaceEl = document.querySelector("#interface");
		if (!interfaceEl) return;
		observer.observe(interfaceEl, { childList: true, subtree: true });
		el._observer = observer;
	},
	unmounted(el) {
		el._observer?.disconnect();
	}
};
