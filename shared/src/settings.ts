import type { ShallowRef } from 'vue';
import { shallowRef } from 'vue';

import type { FoundryRpgmModule } from './module';
import { hudHeuristics } from './radial-menu';
import { DeveloperSettings } from './settings/developer';
import { RadialMenuSettings } from './settings/radialMenu';
import SidebarAccount from './sidebar/SidebarApp/SidebarAccount';
import SidebarAccountByoAI from './sidebar/SidebarApp/SidebarAccount/SidebarAccountByoAI.vue';
import SidebarAppHelp from './sidebar/SidebarApp/SidebarAppHelp.vue';
import SidebarAppShop from './sidebar/SidebarApp/SidebarAppShop.vue';

export class LocalStorageMap<T extends object> {
	private holders = new Map<keyof T, ShallowRef<T[keyof T] | null>>();

	constructor(private prefix: string, private defaults: T) { }

	private storageKey(key: keyof T): string {
		return `${this.prefix}.${String(key)}`;
	}

	/** Deserialize with error handling. */
	private readValue<K extends keyof T>(key: K): T[K] | null {
		const raw = localStorage.getItem(this.storageKey(key));
		if (raw == null) return null;
		try {
			return JSON.parse(raw) as T[K];
		} catch {
			return null;
		}
	}

	private writeValue<K extends keyof T>(key: K, value: T[K] | null) {
		if (value === null) {
			localStorage.removeItem(this.storageKey(key));
		} else {
			localStorage.setItem(this.storageKey(key), JSON.stringify(value));
		}
	}

	/**
	 * Get typed value (non-reactive).
	 */
	get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K] {
		return this.readValue(key) ?? (defaultValue ?? this.defaults[key]);
	}

	/**
	 * Get or create a reactive ref for this key.
	 */
	ref<K extends keyof T>(key: K, defaultValue?: T[K]): ShallowRef<T[K]> {
		let holder = this.holders.get(key);
		if (!holder) {
			holder = shallowRef<T[K]>(this.readValue(key) ?? (defaultValue ?? this.defaults[key]));
			watch(holder as ShallowRef<T[K]>, (v) => this.writeValue(key, v), { deep: true });
			this.holders.set(key, holder as ShallowRef<T[keyof T] | null>);
		}
		return holder as ShallowRef<T[K]>;
	}

	/**
	 * Set value (updates storage + reactive ref).
	 */
	set<K extends keyof T>(key: K, value: T[K]): this {
		this.writeValue(key, value);
		let holder = this.holders.get(key) as ShallowRef<T[K] | null> | undefined;
		if (!holder) {
			holder = shallowRef<T[K] | null>(value);
			this.holders.set(key, holder as ShallowRef<T[keyof T] | null>);
		} else {
			holder.value = value;
		}
		return this;
	}

	/**
	 * Delete value (removes from storage + reactive ref → null).
	 */
	delete(key: keyof T): void {
		this.writeValue(key, null);
		const holder = this.holders.get(key);
		if (holder) {
			holder.value = null;
		}
	}
}

/** Register shared settings once. */
export function GlobalSettings() {
	game.settings.register('rpgm-tools', 'radial_menu_input', {
		name: rpgm.localize('RPGM_TOOLS.CONFIG.RADIAL_MENU_INPUT'),
		hint: rpgm.localize('RPGM_TOOLS.CONFIG.RADIAL_MENU_INPUT_HINT'),
		default: false
	});
	game.settings.register('rpgm-tools', 'radial_menu_hud', {
		name: rpgm.localize('RPGM_TOOLS.CONFIG.RADIAL_MENU_HUD'),
		hint: rpgm.localize('RPGM_TOOLS.CONFIG.RADIAL_MENU_HUD_HINT'),
		default: true
	});
	game.settings.register('rpgm-tools', 'radial_menu_debug', {
		name: rpgm.localize('RPGM_TOOLS.CONFIG.RADIAL_MENU_DEBUG'),
		hint: rpgm.localize('RPGM_TOOLS.CONFIG.RADIAL_MENU_DEBUG_HINT'),
		default: false
	});
	rpgm.radialMenu.registerCategory('rpgm_debug', { color: '60deg', logger: rpgm.logger });
	rpgm.radialMenu.registerTokenHudButton({
		category: rpgm.radialMenu.categories.rpgm_debug,
		icon: 'fa-regular fa-circle-info',
		tooltip: 'RPGM_TOOLS.RADIAL_MENU.INFO',
		detective: (context) => hudHeuristics(context).isGM().isDebug().result,
		callback: (context) => rpgm.logger.debug(context.token),
		logger: rpgm.logger
	});

	rpgm.sidebar.registerSidebarMenu({
		path: '/account',
		meta: {
			title: 'Account',
			menu: {
				icon: 'fa-solid fa-user',
				color: '#c8016e',
				index: 1
			}
		},
		component: SidebarAccount
	});

	rpgm.sidebar.registerSidebarMenu({
		path: '/account/bring-your-own-ai',
		component: SidebarAccountByoAI,
		meta: {
			title: 'I have my own AI'
		}
	});

	rpgm.sidebar.registerSidebarMenu({
		path: '/shop',
		meta: {
			title: 'Shop',
			menu: {
				icon: 'fa-solid fa-store',
				color: '#ff8000',
				index: -1
			}
		},
		component: SidebarAppShop
	});

	rpgm.sidebar.registerSidebarMenu({
		path: '/help',
		meta: {
			title: 'Help',
			menu: {
				icon: 'fa-solid fa-question-circle',
				color: '#aaaaaa',
				index: -1
			}
		},
		component: SidebarAppHelp
	});
}

/**
 * Register shared settings menus on each module's settings page.
 * @param id - The foundry module to register menus to
 */
export function GlobalMenus(module: FoundryRpgmModule) {
	if (module.id === 'rpgm-tools') return;
	RadialMenuSettings.registerMenu(module.id);
	// SecretsSettings.registerMenu(module.id);
	DeveloperSettings.registerMenu(module.id);
}
