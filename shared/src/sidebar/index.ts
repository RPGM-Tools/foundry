export class RpgmSidebarManager {
	get menus(): ReadonlyArray<SidebarMenu> { return this._menus; }
	private _menus: SidebarMenu[] = [];

	constructor() {
		void this.initSidebar();
	}

	private async initSidebar() {
		const isLegacy = rpgm.majorGameVersion <= 12;
		const RpgmSidebar = (await import(isLegacy ? "./legacy.ts" : "./modern.ts"))
			.default;

		CONFIG.ui["rpgm"] = RpgmSidebar;
	}

	registerSidebarMenu(options: SidebarMenu) {
		if (this._menus.some(m => m.id === options.id)) {
			rpgm.logger.error(`Sidebar menu '${options.id}' already registered`);
		} else
			this._menus.push(options);
	}
}
