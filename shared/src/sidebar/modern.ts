import { createApp, type App, type Component } from 'vue';
import RpgmSidebarApp from "./RpgmSidebarApp.vue";
import type { DeepPartial } from 'fvtt-types/utils';

type ClosingOptions = foundry.applications.api.ApplicationV2.ClosingOptions;
type Configuration = foundry.applications.api.ApplicationV2.Configuration;

export default class RpgmSidebar extends foundry.applications.sidebar.AbstractSidebarTab {
	app?: App;

	constructor(options: DeepPartial<foundry.applications.api.ApplicationV2.Configuration>) {
		//@ts-expect-error thing
		CONFIG.RpgmSidebar = {
			sidebarIcon: "rp-dice",
			documentClass: RpgmSidebar,
		};
		foundry.applications.sidebar.Sidebar.TABS.rpgm = {
			//@ts-expect-error thing
			documentName: "RpgmSidebar",
			tooltip: "RPGM_TOOLS.SIDEBAR.TITLE",
		};
		rpgm.logger.log("New RpgmSidebar");
		super(options);
	}

	static override tabName = "rpgm";

	static override DEFAULT_OPTIONS: DeepPartial<Configuration> = {
		classes: ["settings-sidebar", "rpgm-app"],
		window: {
			title: "RPGM Tools",
			icon: "rp-dice"
		},
	};

	override async _renderHTML() {
		const mount = (this.element.querySelector(".window-content") ?? this.element) as HTMLElement;
		if (!this.popout) mount.classList.add("static");
		return mount;
	}

	override _replaceHTML(result: HTMLElement) {
		if (this.app) return;
		this.app = createApp(RpgmSidebarApp as Component);
		this.app.mount(result);
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
