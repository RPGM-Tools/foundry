import { DeveloperSettings } from "./settings/developer"
import { RadialMenuSettings } from "./settings/radialMenu"
import { SecretsSettings } from "./settings/secrets"

/** Register shared settings once */
export function GlobalSettings() {
	game.settings.register("rpgm-tools", "api_key", {
		name: rpgm.localize("RPGM.CONFIG.API_KEY"),
		hint: rpgm.localize("RPGM.CONFIG.API_KEY_HINT"),
		type: String,
	})
	game.settings.register("rpgm-tools", "radial_menu_enabled", {
		name: rpgm.localize("RPGM.CONFIG.RADIAL_MENU_ENABLED"),
		hint: rpgm.localize("RPGM.CONFIG.RADIAL_MENU_ENABLED_HINT"),
		default: true,
	})
	game.settings.register("rpgm-tools", "debug_mode", {
		name: rpgm.localize("RPGM.CONFIG.DEBUG_MODE"),
		hint: rpgm.localize("RPGM.CONFIG.DEBUG_MODE_HINT"),
		default: false,
	})
}

/** Register shared settings menus on each module's settings page */
export function GlobalMenus(id: string) {
	game.settings.registerMenu(id, "radial-menu", {
		name: rpgm.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS"),
		hint: rpgm.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS_HINT"),
		label: rpgm.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS"),
		icon: "fas fa-dice-d20",
		type: RadialMenuSettings,
		restricted: true,
	})
	game.settings.registerMenu(id, "secrets", {
		name: rpgm.localize("RPGM.CONFIG.SECRETS_SETTINGS"),
		hint: rpgm.localize("RPGM.CONFIG.SECRETS_SETTINGS_HINT"),
		label: rpgm.localize("RPGM.CONFIG.SECRETS_SETTINGS"),
		icon: "fas fa-key",
		type: SecretsSettings,
		restricted: true,
	})
	game.settings.registerMenu(id, "developer", {
		name: rpgm.localize("RPGM.CONFIG.DEVELOPER_SETTINGS"),
		hint: rpgm.localize("RPGM.CONFIG.DEVELOPER_SETTINGS_HINT"),
		label: rpgm.localize("RPGM.CONFIG.DEVELOPER_SETTINGS"),
		icon: "fa fa-flask",
		type: DeveloperSettings,
		restricted: true
	})
}
