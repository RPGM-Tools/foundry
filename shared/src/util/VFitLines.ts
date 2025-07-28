import type { Directive } from "vue";

type FitHTMLElement = HTMLElement & {
	_mObserver?: MutationObserver,
	_rObserver?: ResizeObserver,
	_size?: number, _max?: number
}

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
	html.style.overflow = "hidden";
	html.style.boxSizing = "content-box";
	html.style.whiteSpace = "nowrap";
}

export const vFitLines: Directive<FitHTMLElement> = {
	beforeMount(html) {
		html._mObserver = new MutationObserver(e => void onEnter(e[0].target as FitHTMLElement));
		html._mObserver.observe(html, { childList: true });
		html._rObserver = new ResizeObserver(e => void onEnter(e[0].target as FitHTMLElement));
		html._rObserver.observe(html, { box: "border-box" });
		void nextTick(() => onEnter(html));
	},
	updated: void onEnter,
	beforeUnmount(el) {
		el._mObserver?.disconnect();
		el._rObserver?.disconnect();
	}
};
