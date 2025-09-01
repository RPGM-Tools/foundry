import { hudHeuristics } from './radial-menu';
import { DeveloperSettings } from './settings/developer';
import { RadialMenuSettings } from './settings/radialMenu';
import SidebarAccount from './sidebar/SidebarApp/SidebarAccount';
import SidebarAccountByoAI from './sidebar/SidebarApp/SidebarAccount/SidebarAccountByoAI.vue';
import SidebarAppHelp from './sidebar/SidebarApp/SidebarAppHelp.vue';
import SidebarAppShop from './sidebar/SidebarApp/SidebarAppShop.vue';

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
	rpgm.radialMenu.registerCategory('rpgm_debug', { color: '60deg', logger: rpgm.tools.logger });
	rpgm.radialMenu.registerTokenHudButton({
		category: rpgm.radialMenu.categories.rpgm_debug,
		icon: 'fa-regular fa-circle-info',
		tooltip: 'RPGM_TOOLS.RADIAL_MENU.INFO',
		detective: (context) => hudHeuristics(context).isGM().isDebug().result,
		callback: (context) => rpgm.tools.logger.log(context.token),
		logger: rpgm.tools.logger
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
export function GlobalMenus(id: string) {
	RadialMenuSettings.registerMenu(id);
	// SecretsSettings.registerMenu(id);
	DeveloperSettings.registerMenu(id);
}
