import type { App, Component } from 'vue';
import type { Reactive } from "vue";
import { createApp, shallowReactive } from 'vue';

import { injectTokenHUD } from './hud';
import RadialMenuFloating from './RadialMenuFloating.vue';

export * from './funcs';
export * from './heuristics';

/**
 * Manages all radial menu instances 
 */
export class RadialMenuRegister {
	elements = new Map<HTMLElement, { vueApp: App, injectedEl: HTMLElement }>();
	private _categories = {} as Record<keyof RadialMenuCategories, RadialMenuCategoryOptions>;
	/** @returns The categories registered that can be used */
	get categories(): Readonly<typeof this._categories> { return this._categories; }
	buttons: RadialButton<InputContext>[] = [];
	tokenHudButtons: RadialButton<TokenHudContext>[] = [];
	inputObserver: MutationObserver;

	constructor() {
		// CONFIG.Token.hudClass = RPGMTokenHUD;
		injectTokenHUD();
		this.inputObserver = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				mutation.removedNodes.forEach(node => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const el = node as HTMLElement;
						this.deleteRadialMenu(el);
					}
				});
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const el = node as HTMLElement;
						this.recursivelyWatch(el);
					}
				});
			});
		});
	}

	/**
	 * @param el - Mount a radial menu to the top-right of {@link el}
	 */
	private createRadialMenu(el: HTMLElement) {
		const vueApp = createApp(RadialMenuFloating as Component, { element: el });
		const appContainer = document.createElement('div');
		appContainer.style.position = 'fixed';
		appContainer.style.zIndex = '99';
		el.insertAdjacentElement('afterend', appContainer);
		let getValue: () => string;
		let setValue: (value: string) => void;
		if (el.contentEditable === 'true') {
			getValue = () => el.textContent ?? "";
			setValue = (value) => { el.textContent = value; };
		} else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
			getValue = () => el.value;
			setValue = (value) => { el.value = value; };
		} else {
			getValue = () => "";
			setValue = () => { };
		}
		vueApp.provide('element', el);
		vueApp.provide<RadialButton<InputContext>[]>('buttons', rpgm.radialMenu.buttons);
		vueApp.provide<Reactive<InputContext>>('context', shallowReactive({
			shift: false,
			loading: false,
			element: el,
			getValue,
			setValue
		}));
		this.elements.set(el, { vueApp, injectedEl: appContainer });
		vueApp.mount(appContainer, true);
	}

	/**
	 * @param el - Deletes a radial menu mounted to {@link el}
	 */
	private deleteRadialMenu(el: HTMLElement): void {
		if (!this.elements.has(el)) return;
		const { vueApp, injectedEl } = this.elements.get(el) as { vueApp: App, injectedEl: HTMLElement };
		vueApp.unmount();
		injectedEl.remove();
		this.elements.delete(el);
	}

	/**
	 * @param root - Scans for added nodes that can be injected
	 */
	recursivelyWatch(root: ParentNode): void {
		const selectors = [
			'input[type="text"][inputmode="text"]:not(.rpgm-radial-ignore):not([disabled])',
			'input[type="text"]:not(.rpgm-radial-ignore):not([disabled]):not([inputmode])',
			'textarea:not(.rpgm-radial-ignore)',
			'[contenteditable="true"]:not(.rpgm-radial-ignore)'].join(',');
		const inputs = root.parentElement?.querySelectorAll(selectors);
		if (!inputs) return;

		inputs.forEach(
			input => {
				if (!(input instanceof HTMLElement)) return;
				if (this.elements.has(input)) return;
				this.createRadialMenu(input);
			}
		);
	}

	/** Matches functionality of the radial menu with the user's setting */
	update() {
		if (game.settings.get("rpgm-tools", "radial_menu_input") === true) {
			this.startWatching();
		}
		else
			this.stopWatching();
	}

	/** Activate watcher */
	startWatching() {
		this.inputObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
		this.recursivelyWatch(document.body);
	}

	/** Deactivate watcher */
	stopWatching() {
		this.inputObserver.disconnect();
		this.elements.forEach((value, key) => {
			value.vueApp.unmount();
			value.injectedEl.remove();
			this.elements.delete(key);
		});
	}

	/**
	 * @param id - The id this category is registered to
	 * @param category - Options for this category
	 */
	registerCategory<T extends keyof RadialMenuCategories>(id: T, category: RadialMenuCategoryOptions) {
		rpgm.logger.debug(`Registering radial menu category: ${id}`);
		this._categories[id] = category;
	}

	/**
	 * @param button - The input button to register
	 */
	registerInputButton(button: RadialButton<InputContext>) {
		rpgm.logger.debug(`Registering radial menu button: ${button.tooltip}`);
		this.buttons.push(button);
	}

	/**
	 * @param button - The hud button to register
	 */
	registerTokenHudButton(button: RadialButton<TokenHudContext>) {
		rpgm.logger.debug(`Registering radial menu button: ${button.tooltip}`);
		this.tokenHudButtons.push(button);
	}
}
