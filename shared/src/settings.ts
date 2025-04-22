import { DeveloperSettings } from "./settings/developer"
import { RadialMenuSettings } from "./settings/radialMenu"
import { SecretsSettings } from "./settings/secrets"

/** Register shared settings once */
export function GlobalSettings() {
	game.settings.register("rpgm-tools", "api_key", {
		name: rpgm.localize("CONFIG.API_KEY"),
		hint: rpgm.localize("CONFIG.API_KEY_HINT"),
		type: String,
	})
	game.settings.register("rpgm-tools", "radial_menu_enabled", {
		name: rpgm.localize("CONFIG.RADIAL_MENU_ENABLED"),
		hint: rpgm.localize("CONFIG.RADIAL_MENU_ENABLED_HINT"),
		default: true,
	})
	game.settings.register("rpgm-tools", "debug_mode", {
		name: rpgm.localize("CONFIG.DEBUG_MODE"),
		hint: rpgm.localize("CONFIG.DEBUG_MODE_HINT"),
		default: false,
	})
}

/** Register shared settings menus on each module's settings page */
export function GlobalMenus(id: string) {
	game.settings.registerMenu(id, "radial-menu", {
		name: rpgm.localize("CONFIG.RADIAL_MENU_SETTINGS"),
		hint: rpgm.localize("CONFIG.RADIAL_MENU_SETTINGS_HINT"),
		label: rpgm.localize("CONFIG.RADIAL_MENU_SETTINGS"),
		icon: "fas fa-dice-d20",
		type: RadialMenuSettings,
		restricted: true,
	})
	game.settings.registerMenu(id, "secrets", {
		name: rpgm.localize("CONFIG.SECRETS_SETTINGS"),
		hint: rpgm.localize("CONFIG.SECRETS_SETTINGS_HINT"),
		label: rpgm.localize("CONFIG.SECRETS_SETTINGS"),
		icon: "fas fa-key",
		type: SecretsSettings,
		restricted: true,
	})
	game.settings.registerMenu(id, "developer", {
		name: rpgm.localize("CONFIG.DEVELOPER_SETTINGS"),
		hint: rpgm.localize("CONFIG.DEVELOPER_SETTINGS_HINT"),
		label: rpgm.localize("CONFIG.DEVELOPER_SETTINGS"),
		icon: "fa fa-flask",
		type: DeveloperSettings,
		restricted: true
	})
}
