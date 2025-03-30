import * as logging from '#/util/logging'
import { createApp, App } from 'vue'
import RadialMenu, { InjectedElement } from './RadialMenu.vue'

export class RadialMenuRegister {
	elements = new Map<HTMLElement, { vueApp: App, injectedEl: HTMLElement }>()
	categories: Map<string, RadialMenuCategoryOptions> = new Map()
	buttons: MenuButton[] = []
	observer: MutationObserver

	constructor() {
		this.observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				mutation.removedNodes.forEach(node => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const el = node as HTMLElement
						this.deleteRadialMenu(el)
					}
				})
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const el = node as HTMLElement
						this.recursivelyWatch(el)
					}
				})
			})
		})
		this.update()
	}

	private createRadialMenu(el: HTMLElement): void {
		const vueApp = createApp(RadialMenu, { element: el })
		const appContainer = document.createElement('div')
		appContainer.style.position = 'fixed'
		appContainer.style.zIndex = '99'
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
		vueApp.provide<MenuButton[]>('items', rpgm.radialMenu.buttons)
		this.elements.set(el, { vueApp, injectedEl: appContainer })
		vueApp.mount(appContainer)
	}
	private deleteRadialMenu(el: HTMLElement): void {
		if (!this.elements.has(el)) return
		const { vueApp, injectedEl } = this.elements.get(el) as { vueApp: App, injectedEl: HTMLElement }
		vueApp.unmount()
		injectedEl.remove()
	}

	recursivelyWatch(root: ParentNode): void {
		const selectors = 'input[type="text"][inputmode="text"],input[type="text"]:not([inputmode]),textarea,[contenteditable="true"]'
		const inputs = root.querySelectorAll(selectors)

		inputs.forEach(
			input => {
				if (!(input instanceof HTMLElement)) return
				if (this.elements.has(input)) return
				this.createRadialMenu(input as HTMLElement)
			}
		)
	}


	update() {
		if (game.settings.get("rpgm-tools", "radial_menu_enabled") === "true")
			this.startWatching()
		else
			this.stopWatching()
	}

	startWatching() {
		this.observer.observe(document.body, {
			childList: true,
			subtree: true
		})
		this.recursivelyWatch(document.body)
	}

	stopWatching() {
		this.observer.disconnect()
		this.elements.forEach((value, key) => {
			value.vueApp.unmount()
			value.injectedEl.remove()
			this.elements.delete(key)
		})
	}

	registerCategory(key: string, options: RadialMenuCategoryOptions) {
		this.categories.set(key, options)
	}

	registerButton(button: MenuButton) {
		if (this.categories.has(button.category))
			this.buttons.push(button)
		else
			logging.error(`Failed to register radial button: "${button.category} " is not a valid category!`)
	}
}
