import * as logging from "#/util/logging"
import { createApp, App } from 'vue'
// Import your Vue component for the magic button/menu
import RadialMenu, { InjectedElement, RadialMenuItem } from './RadialMenu.vue'

const elements = new WeakMap<HTMLElement, { vueApp: App, injectedEl: HTMLElement }>()

function createRadialMenu(el: HTMLElement): void {
	const vueApp = createApp(RadialMenu, { element: el })
	const appContainer = document.createElement('div')
	appContainer.style.position = 'fixed'
	appContainer.style.zIndex = '999'
	el.insertAdjacentElement('afterend', appContainer)
	let injectedElement: InjectedElement
	if (el.contentEditable === 'true') {
		injectedElement = {
			element: el,
			get value(): string { return el.innerText },
			set value(value: string) { el.innerHTML = value },
		}
	} else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
		// if current value is numeric, skip this element
		if (/^\d+$/.test(el.value)) return
		injectedElement = {
			element: el,
			get value(): string { return el.value },
			set value(value: string) { el.value = value },
		}
	} else {
		injectedElement = {
			element: el,
			get value(): string { return "" },
			set value(_: string) { return },
		}
	}
	vueApp.provide<InjectedElement>('element', injectedElement)
	vueApp.provide<RadialMenuItem[]>('items', [
		{
			color: "90deg",
			callback: ({ element }) => { element.value = "You clicked the D4!" },
			icon: 'fa fa-dice-d4',
			tooltip: "Roll a D4"
		},
		{
			color: "180deg",
			callback: ({ element }) => { element.value = "You clicked the D6!" },
			icon: 'fa fa-dice-d6',
			tooltip: "Roll a D6"
		},
		{
			color: "270deg",
			callback: ({ element }) => { element.value = "You clicked the D8!" },
			icon: 'fa fa-dice-d8',
			tooltip: "Roll a D8"
		},
		{
			color: "0deg",
			callback: ({ element }) => { element.value = "You clicked the D10!" },
			icon: 'fa fa-dice-d10',
			tooltip: "Roll a D10"
		},
		{
			color: "90deg",
			callback: ({ element }) => { element.value = "You clicked the D12!" },
			icon: 'fa fa-dice-d12',
			tooltip: "Roll a D12"
		},
		{
			color: "180deg",
			callback: ({ element }) => { element.value = "You clicked the D20!" },
			icon: 'fa fa-dice-d20',
			tooltip: "Roll a D20"
		},
		{
			color: "270deg",
			callback: ({ element }) => { element.value = "Searching..." },
			icon: 'fa fa-magnifying-glass',
			tooltip: "Search"
		},
		{
			color: "0deg",
			callback: ({ element }) => { element.value = "Use your imagination ;)" },
			icon: 'fa fa-wand-magic-sparkles',
			tooltip: "Magic"
		},
	])
	elements.set(el, { vueApp, injectedEl: appContainer })
	setTimeout(() => {
		vueApp.mount(appContainer)
	}, 1)
}

function deleteRadialMenu(el: HTMLElement): void {
	if (!elements.has(el)) return
	const { vueApp, injectedEl } = elements.get(el) as { vueApp: App, injectedEl: HTMLElement }
	injectedEl.remove()
	vueApp.unmount()
}

function recursivelyWatch(root: ParentNode): void {
	const selectors = 'input[type="text"][inputmode="text"],input[type="text"]:not([inputmode]),textarea,[contenteditable="true"]'
	const inputs = root.querySelectorAll(selectors)

	inputs.forEach(
		input => {
			if (elements.has(input as HTMLElement)) return
			createRadialMenu(input as HTMLElement)
		}
	)
}

export function watchInputs(): void {
	// Scan for existing elements that should be watched
	logging.log("Watching inputs")
	recursivelyWatch(document.body)

	// Watch for new elements
	new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(node => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const el = node as HTMLElement
					recursivelyWatch(el)
				}
			})
			mutation.removedNodes.forEach(node => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const el = node as HTMLElement
					deleteRadialMenu(el)
				}
			})
		})
	}).observe(document.body, {
		childList: true,
		subtree: true,
	})
}
