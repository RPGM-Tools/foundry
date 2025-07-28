import { hudHeuristics } from "./radial-menu";
import { DeveloperSettings } from "./settings/developer";
import { RadialMenuSettings } from "./settings/radialMenu";
import { SecretsSettings } from "./settings/secrets";
import RpgmSidebarAppHelp from "./sidebar/RpgmSidebarApp/RpgmSidebarAppHelp.vue";
import RpgmSidebarAppShop from "./sidebar/RpgmSidebarApp/RpgmSidebarAppShop.vue";

/** Register shared settings once. */
export function GlobalSettings() {
	game.settings.register("rpgm-tools", "radial_menu_input", {
		name: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_INPUT"),
		hint: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_INPUT_HINT"),
		default: false,
	});
	game.settings.register("rpgm-tools", "radial_menu_hud", {
		name: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_HUD"),
		hint: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_HUD_HINT"),
		default: true,
	});
	game.settings.register("rpgm-tools", "radial_menu_debug", {
		name: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_DEBUG"),
		hint: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_DEBUG_HINT"),
		default: false,
	});
	game.settings.register("rpgm-tools", "login-token", {
		default: "",
	});
	rpgm.radialMenu.registerCategory("rpgm_debug", { color: '60deg' });
	rpgm.radialMenu.registerTokenHudButton({
		category: rpgm.radialMenu.categories.rpgm_debug,
		icon: 'fa-regular fa-circle-info',
		tooltip: "RPGM_TOOLS.RADIAL_MENU.INFO",
		detective: (context) => hudHeuristics(context).isGM().isDebug().result,
		callback: (context) => rpgm.logger.log(context.token)
	});

	rpgm.sidebar.registerSidebarMenu({
		id: "account",
		title: "Account",
		icon: "fa-solid fa-user",
		color: "#c8016e",
	});

	rpgm.sidebar.registerSidebarMenu({
		id: "shop",
		title: "Shop",
		icon: "fa-solid fa-store",
		color: "#ff8000",
		component: RpgmSidebarAppShop,
	});

	rpgm.sidebar.registerSidebarMenu({
		id: "help",
		title: "Help",
		icon: "fa-solid fa-question-circle",
		color: "#aaaaaa",
		component: RpgmSidebarAppHelp,
	});
}

/**
 * Register shared settings menus on each module's settings page.
 * @param id - The foundry module to register menus to
 */
export function GlobalMenus(id: string) {
	RadialMenuSettings.registerMenu(id);
	SecretsSettings.registerMenu(id);
	DeveloperSettings.registerMenu(id);
}
