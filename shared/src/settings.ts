import { ChatCommands } from "./chat";
import { RadialMenuRegister } from "./radial-menu";
import { DeveloperSettings } from "./settings/developer";
import { RadialMenuSettings } from "./settings/radialMenu";
import { SecretsSettings } from "./settings/secrets";
import { localize } from "./util/localize";
import { RPGMLogger } from "./util/logging";

export function GlobalInit() {
	globalThis.rpgm = {
		gameVersion: game.version,
		majorGameVersion: game.data.release.generation,
		logger: new RPGMLogger(),
		radialMenu: new RadialMenuRegister(),
		chat: new ChatCommands(),
		modules: {},
		localize,
	};

}

/** Register shared settings once */
export function GlobalSettings() {
	game.settings.register("rpgm-tools", "api_key", {
		name: rpgm.localize("RPGM_TOOLS.CONFIG.API_KEY"),
		hint: rpgm.localize("RPGM_TOOLS.CONFIG.API_KEY_HINT"),
		type: String,
	});
	game.settings.register("rpgm-tools", "radial_menu_enabled", {
		name: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_ENABLED"),
		hint: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_ENABLED_HINT"),
		default: true,
	});
	game.settings.register("rpgm-tools", "radial_menu_debug", {
		name: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_DEBUG"),
		hint: rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_DEBUG_HINT"),
		default: false,
	});
	game.settings.register("rpgm-tools", "verbose-logs", {
		name: rpgm.localize("RPGM_TOOLS.CONFIG.VERBOSE_LOGS"),
		hint: rpgm.localize("RPGM_TOOLS.CONFIG.VERBOSE_LOGS_HINT"),
		default: false,
	});
}

/** Register shared settings menus on each module's settings page */
export function GlobalMenus(id: string) {
	RadialMenuSettings.registerMenu(id);
	SecretsSettings.registerMenu(id);
	DeveloperSettings.registerMenu(id);
}
