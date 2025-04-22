import { SecretsSettings } from "./secrets"
import { RadialMenuSettings } from "./radialMenu"

/** Register shared settings once */
export function GlobalSettings() {
	game.settings.register("rpgm-tools", "api_key", {
		name: rpgm.localize("CONFIG.API_KEY"),
		hint: rpgm.localize("CONFIG.API_KEY_HINT"),
		requiresReload: true,
		type: String,
	})
	game.settings.register("rpgm-tools", "verbosity", {
		name: rpgm.localize("CONFIG.VERBOSITY"),
		hint: rpgm.localize("CONFIG.VERBOSITY_HINT"),
		type: String,
	})
	game.settings.register("rpgm-tools", "radial_menu_enabled", {
		name: rpgm.localize("CONFIG.RADIAL_MENU_ENABLED"),
		hint: rpgm.localize("CONFIG.RADIAL_MENU_ENABLED_HINT"),
	})
}

/** Register shared settings menus on each module's settings page,
 * should be called after registering your own settings */
export function GlobalMenus(id: string) {
	game.settings.registerMenu(id, "secrets", {
		name: rpgm.localize("CONFIG.SECRETS_SETTINGS"),
		hint: rpgm.localize("CONFIG.SECRETS_SETTINGS_HINT"),
		label: rpgm.localize("CONFIG.SECRETS_SETTINGS"),
		icon: "fas fa-key",
		type: SecretsSettings,
		restricted: true,
	})
	game.settings.registerMenu(id, "radial-menu", {
		name: rpgm.localize("CONFIG.RADIAL_MENU_SETTINGS"),
		hint: rpgm.localize("CONFIG.RADIAL_MENU_SETTINGS_HINT"),
		label: rpgm.localize("CONFIG.RADIAL_MENU_SETTINGS"),
		icon: "fas dice-d20",
		type: RadialMenuSettings,
		restricted: true,
	})
}
