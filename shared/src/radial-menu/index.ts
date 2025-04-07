import * as logging from '#/util/logging'
import { createApp, App, reactive } from 'vue'
import RadialMenu from './RadialMenu.vue'
import { RPGMTokenHUD } from './hud'

export { contextHeuristics } from './heuristics'
export { writeOn } from './funcs'

export class RadialMenuRegister {
	elements = new Map<HTMLElement, { vueApp: App, injectedEl: HTMLElement }>()
	categories: Map<string, RadialMenuCategoryOptions> = new Map()
	buttons: RadialButton<InputContext>[] = []
	tokenHudButtons: RadialButton<TokenHudContext>[] = []
	inputObserver: MutationObserver

	constructor() {
		CONFIG.Token.hudClass = RPGMTokenHUD
		this.inputObserver = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				mutation.removedNodes.forEach(node => {
					console.log("Removed:", node)
					if (node.nodeType === Node.ELEMENT_NODE) {
						const el = node as HTMLElement
						this.deleteRadialMenu(el)
					}
				})
				mutation.addedNodes.forEach(node => {
					console.log("Added:", node)
					if (node.nodeType === Node.ELEMENT_NODE) {
						const el = node as HTMLElement
						this.recursivelyWatch(el)
					}
				})
			})
		})
	}

	private async createRadialMenu(el: HTMLElement) {
		const vueApp = createApp(RadialMenu, { element: el })
		const appContainer = document.createElement('div')
		appContainer.style.position = 'fixed'
		appContainer.style.zIndex = '99'
		el.insertAdjacentElement('afterend', appContainer)
		let getValue: () => string
		let setValue: (value: string) => void
		if (el.contentEditable === 'true') {
			getValue = () => el.textContent ?? ""
			setValue = (value) => { el.textContent = value }
		} else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
			getValue = () => el.value
			setValue = (value) => { el.value = value }
		} else {
			getValue = () => ""
			setValue = () => { }
		}
		vueApp.provide('element', el)
		vueApp.provide<RadialButton<InputContext>[]>('items', rpgm.radialMenu.buttons)
		vueApp.provide<InputContext>('context', reactive({
			loading: false,
			element: el,
			getValue,
			setValue
		}))
		this.elements.set(el, { vueApp, injectedEl: appContainer })
		vueApp.mount(appContainer, true)
	}
	private deleteRadialMenu(el: HTMLElement): void {
		if (!this.elements.has(el)) return
		const { vueApp, injectedEl } = this.elements.get(el) as { vueApp: App, injectedEl: HTMLElement }
		vueApp.unmount()
		injectedEl.remove()
		this.elements.delete(el)
	}

	recursivelyWatch(root: ParentNode): void {
		const selectors = [
			'input[type="text"][inputmode="text"]:not([disabled])',
			'input[type="text"]:not([disabled]):not([inputmode])',
			'textarea',
			'[contenteditable="true"]'].join(',')
		const inputs = root.parentElement?.querySelectorAll(selectors)
		if (!inputs) return

		inputs.forEach(
			input => {
				if (!(input instanceof HTMLElement)) return
				if (this.elements.has(input)) return
				this.createRadialMenu(input)
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
		this.inputObserver.observe(document.body, {
			childList: true,
			subtree: true,
		})
		this.recursivelyWatch(document.body)
	}

	stopWatching() {
		this.inputObserver.disconnect()
		this.elements.forEach((value, key) => {
			value.vueApp.unmount()
			value.injectedEl.remove()
			this.elements.delete(key)
		})
	}

	registerCategory(key: string, options: RadialMenuCategoryOptions) {
		this.categories.set(key, options)
	}

	registerInputButton(button: RadialButton<InputContext>) {
		if (this.categories.has(button.category))
			this.buttons.push(button)
		else
			logging.error(`Failed to register radial button: "${button.category} " is not a valid category!`)
	}

	registerTokenHudButton(button: RadialButton<TokenHudContext>) {
		if (this.categories.has(button.category))
			this.tokenHudButtons.push(button)
		else
			logging.error(`Failed to register radial button: "${button.category} " is not a valid category!`)
	}
}
