import { useDebounceFn } from '@vueuse/core';
import type { InjectionKey } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import SidebarAppMenu from './SidebarApp/SidebarAppMenu.vue';

export const titleKey = 'titleKey' as unknown as InjectionKey<(title: string | undefined) => void>;
export const resizeKey = 'resizeKey' as unknown as InjectionKey<(forceCenter?: boolean) => void>;

export function useTitle() {
	return inject(titleKey)!;
}

export function useResize(delay: number = 0) {
	return useDebounceFn(inject(resizeKey)!, delay);
}

export class RpgmSidebarManager {
	get menus(): ReadonlyArray<SidebarMenu> { return this._menus; }
	private _menus: SidebarMenu[] = [];

	constructor() {
		void this.initSidebar();
	}

	routes: RouteRecordRaw[] = [
		{
			path: '/',
			name: 'RPGM Tools',
			component: SidebarAppMenu,
			meta: {
				title: 'RPGM Tools'
			}
		}
	]
		;

	private async initSidebar() {
		const isLegacy = rpgm.majorGameVersion <= 12;
		const RpgmSidebar = (await import(isLegacy ? './legacy.ts' : './modern.ts'))
			.default;

		CONFIG.ui['rpgm'] = RpgmSidebar;
	}

	registerSidebarMenu(options: RouteRecordRaw) {
		this.routes.push(options);
	}
}
