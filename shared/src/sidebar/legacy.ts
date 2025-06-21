import { createApp, type App, type Component } from 'vue';
import RpgmSidebarApp from "./RpgmSidebarApp.vue";

declare class SidebarTab extends Application { }

declare global {
	interface Sidebar {
		/** @deprecated */
		activeTab: string;
	}
}

export default class RpgmSidebar extends SidebarTab {
	app?: App;

	constructor(options: Partial<Application.Options>) {
		//@ts-expect-error thing
		const getData = Sidebar.prototype.getData;
		//@ts-expect-error thing
		Sidebar.prototype.getData = function(options = {}) {
			const { tabs } = getData(options);
			tabs.rpgm = {
				tooltip: "RPGM_TOOLS.SIDEBAR.TITLE",
				icon: "rp-dice",
			};
			return { tabs };
		};
		super(options);
	}

	static override get defaultOptions(): Application.Options {
		return (foundry.utils.mergeObject(super.defaultOptions, {
			id: "rpgm",
			title: "RPGM Tools",
		} satisfies Partial<Application.Options>));
	};

	override async _renderInner(_data: ReturnType<typeof this["getData"]>) {
		const data = _data as RenderData;

		const mount = document.createElement("section");

		mount.id = data.cssId;
		mount.dataset.tab = data.tabName;
		mount.className = data.cssClass ?? "";

		this.app = createApp(RpgmSidebarApp as Component);
		this.app.mount(mount);

		if (ui.sidebar?.activeTab === this.id) mount.classList.add("active");
		if (this.popOut) {
			mount.classList.remove("tab");
		} else {
			mount.classList.add("rpgm-app", "static");
		}

		return $(mount);
	}

	protected override async _renderOuter(): Promise<JQuery> {
		const html = await super._renderOuter();
		html.addClass("rpgm-app");
		return html;
	}

	override async close(options?: Application.CloseOptions): Promise<void> {
		this.element.addClass("closing");
		await new Promise(p => setTimeout(p, 200));
		return super.close(options);
	}

	static metadata = {
		name: "RpgmSidebar",
	};
}
