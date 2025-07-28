import type { DeepPartial } from 'fvtt-types/utils';
import { type App, type Component, createApp } from 'vue';

import RpgmSidebarApp from "./RpgmSidebarApp";

type ClosingOptions = foundry.applications.api.ApplicationV2.ClosingOptions;
type Configuration = foundry.applications.api.ApplicationV2.Configuration;

export default class RpgmSidebar extends foundry.applications.sidebar.AbstractSidebarTab {
	app?: App;

	constructor(options: DeepPartial<foundry.applications.api.ApplicationV2.Configuration>) {
		CONFIG.RpgmSidebar = {
			sidebarIcon: "rp-dice",
			documentClass: RpgmSidebar,
		};
		foundry.applications.sidebar.Sidebar.TABS.rpgm = {
			//@ts-expect-error TABS is not able to be overriden
			documentName: "RpgmSidebar",
			tooltip: "RPGM_TOOLS.SIDEBAR.TITLE",
		};
		super(options);
	}

	static override tabName = "rpgm";

	static override DEFAULT_OPTIONS: DeepPartial<Configuration> = {
		classes: ["rpgm-app"],
		window: {
			title: "RPGM Tools",
			minimizable: false,
			icon: "rp-dice"
		},
	};

	override minimize(): Promise<void> {
		return Promise.resolve();
	}

	override maximize(): Promise<void> {
		return Promise.resolve();
	}

	override _renderHTML() {
		const mount = (this.element.querySelector(".window-content") ?? this.element);
		if (!this.popout) mount.classList.add("static");
		return Promise.resolve(mount);
	}

	override _replaceHTML(result: HTMLElement) {
		if (this.app) return;
		this.app = createApp(RpgmSidebarApp as Component);
		this.app.provide("onResize", this.onResize.bind(this));
		this.app.mount(result);
		this.onResize(true);
	}

	/** Max content of the sidebar, up to document height - padding */
	private onResize(forceCenter = false) {
		void nextTick(() => {
			const windowHeight = window.innerHeight;
			const maxHeight = Math.min(windowHeight, parseInt(getComputedStyle(this.element).maxHeight) || 0);
			const headerHeight = this.element.querySelector(".window-header")?.clientHeight ?? 0;
			const innerHeight = this.element.querySelector(".sidebar-content")?.scrollHeight ?? 9999;

			const newHeight = Math.min(maxHeight, innerHeight + headerHeight + 70);
			const newTop = ((this.position.top ?? 0) + newHeight) > windowHeight || forceCenter ? (
				Math.max(0, Math.min(windowHeight - newHeight, (windowHeight - newHeight) / 2))
			) : this.position.top;

			this.setPosition({
				height: newHeight,
				top: newTop
			});
		});
	}

	override async close(options?: DeepPartial<ClosingOptions>): Promise<this> {
		this.element.classList.add("closing");
		await new Promise(p => setTimeout(p, 200));
		return super.close({ animate: false, closeKey: options?.closeKey });
	}

	override _onClose(): void {
		this.app?.unmount();
		this.app = undefined;
	}
}
