import type { Directive } from "vue";

type FitHTMLElement = HTMLElement & { _observer?: MutationObserver, _size?: number, _max?: number }

async function onEnter(html: FitHTMLElement) {
	await nextTick();
	html.style.removeProperty("font-size");
	const cStyle = window.getComputedStyle(html);
	html._size = parseInt(cStyle.getPropertyValue("font-size"));
	html._max = html._size - 1;
	let tries = 0;
	while (html.clientWidth < html.scrollWidth && tries < 99) {
		tries++;
		html.style.fontSize = `${--html._size}px`;
		await nextTick();
	}
	updateStyles(html);
}

function updateStyles(html: FitHTMLElement) {
	html.style.fontSize = `${html._size}px`;
	html.style.height = `${html._max}px`;
	html.style.lineHeight = `${html._max}px`;
	html.style.overflowX = "hidden";
	html.style.boxSizing = "content-box";
	html.style.whiteSpace = "nowrap";
}

export const vFitLines: Directive<FitHTMLElement> = {
	beforeMount(html) {
		html._observer = new MutationObserver(e => onEnter(e[0].target as FitHTMLElement));
		html._observer.observe(html, { childList: true });
		onEnter(html);
	},
	updated: updateStyles,
	beforeUnmount(el) {
		el._observer?.disconnect();
	}
};
