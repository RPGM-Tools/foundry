import type { Router, RouteRecordRaw } from 'vue-router';
import { createMemoryHistory, createRouter } from 'vue-router';

import SidebarAppMenu from './SidebarApp/SidebarAppMenu.vue';

export class RpgmSidebarManager {
	get menus(): ReadonlyArray<SidebarMenu> { return this._menus; }
	private _menus: SidebarMenu[] = [];

	constructor() {
		void this.initSidebar();
		this.router = createRouter({
			history: createMemoryHistory(),
			routes: [
				{
					path: '/',
					name: 'RPGM Tools',
					component: SidebarAppMenu,
					meta: {
						title: 'RPGM Tools'
					}
				}
			]
		});
	}

	router: Router;

	private async initSidebar() {
		const isLegacy = rpgm.majorGameVersion <= 12;
		const RpgmSidebar = (await import(isLegacy ? './legacy.ts' : './modern.ts'))
			.default;

		CONFIG.ui['rpgm'] = RpgmSidebar;
	}

	registerSidebarMenu(options: RouteRecordRaw) {
		this.router.addRoute(options);
	}
}
