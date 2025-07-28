import type { DeepPartial } from 'fvtt-types/utils';
import { type App, type Component, createApp } from 'vue';
const { ApplicationV2 } = foundry.applications.api;
type ClosingOptions = foundry.applications.api.ApplicationV2.ClosingOptions

type RenderResult = HTMLElement

export abstract class RPGMSettingsMenu extends ApplicationV2 {
	app?: App;

	abstract component: Component;
	static registerMenu(id: string) {
		throw new Error(`Cannot register abstract class '${this.name}', attempted to register to '${id}'`);
	}

	override async _renderHTML(): Promise<RenderResult> {
		this.element.classList.add("rpgm-app");
		const mount = this.element.querySelector(".window-content") as HTMLElement;
		return new Promise(p => p(mount));
	}

	override _replaceHTML(result: RenderResult): void {
		if (this.app) return;
		this.app = createApp(this.component);
		this.app.provide("app", this);
		this.app.mount(result);
	}

	override async close(options?: DeepPartial<ClosingOptions>): Promise<this> {
		this.element.classList.add("closing");
		await new Promise(p => setTimeout(p, 200));
		return super.close({ animate: false, closeKey: options?.closeKey });
	}

	override _onClose(): void {
		this.app?.unmount();
	}
}
