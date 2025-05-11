import type { App, Component } from 'vue';
import { createApp, type Reactive, shallowReactive } from 'vue';
import RadialMenu from './RadialMenu.vue';
import { RPGMTokenHUD } from './hud';

export * from './heuristics';
export * from './funcs';

export class RadialMenuRegister {
	elements = new Map<HTMLElement, { vueApp: App, injectedEl: HTMLElement }>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	private _categories: Record<keyof RadialMenuCategories, RadialMenuCategoryOptions> = {} as any;
	get categories(): Readonly<typeof this._categories> { return this._categories; }
	buttons: RadialButton<InputContext>[] = [];
	tokenHudButtons: RadialButton<TokenHudContext>[] = [];
	inputObserver: MutationObserver;

	constructor() {
		CONFIG.Token.hudClass = RPGMTokenHUD;
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

	private createRadialMenu(el: HTMLElement) {
		const vueApp = createApp(RadialMenu as Component, { element: el });
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
		vueApp.provide<RadialButton<InputContext>[]>('items', rpgm.radialMenu.buttons);
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
	private deleteRadialMenu(el: HTMLElement): void {
		if (!this.elements.has(el)) return;
		const { vueApp, injectedEl } = this.elements.get(el) as { vueApp: App, injectedEl: HTMLElement };
		vueApp.unmount();
		injectedEl.remove();
		this.elements.delete(el);
	}

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

	update() {
		if (game.settings.get("rpgm-tools", "radial_menu_enabled") === true)
			this.startWatching();
		else
			this.stopWatching();
	}

	startWatching() {
		this.inputObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
		this.recursivelyWatch(document.body);
	}

	stopWatching() {
		this.inputObserver.disconnect();
		this.elements.forEach((value, key) => {
			value.vueApp.unmount();
			value.injectedEl.remove();
			this.elements.delete(key);
		});
	}

	registerCategory<T extends keyof RadialMenuCategories>(id: T, category: RadialMenuCategoryOptions) {
		rpgm.logger.debug(`Registering radial menu category: ${id}`);
		this._categories[id] = category;
	}

	registerInputButton(button: RadialButton<InputContext>) {
		rpgm.logger.debug(`Registering radial menu button: ${rpgm.localize(button.tooltip)}`);
		this.buttons.push(button);
	}

	registerTokenHudButton(button: RadialButton<TokenHudContext>) {
		rpgm.logger.debug(`Registering radial menu button: ${rpgm.localize(button.tooltip)}`);
		this.tokenHudButtons.push(button);
	}
}
