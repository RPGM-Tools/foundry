import { SecretsSettings } from "./secrets"
import { RadialMenuSettings } from "./radialMenu"

/** Register shared settings once */
export function GlobalSettings() {
	game.settings.register("rpgm-tools", "api_key", {
		name: game.i18n.localize("RPGM.CONFIG.API_KEY"),
		hint: game.i18n.localize("RPGM.CONFIG.API_KEY_HINT"),
		requiresReload: true,
		type: String,
	})
	game.settings.register("rpgm-tools", "verbosity", {
		name: game.i18n.localize("RPGM.CONFIG.VERBOSITY"),
		hint: game.i18n.localize("RPGM.CONFIG.VERBOSITY_HINT"),
		type: String,
	})
	game.settings.register("rpgm-tools", "radial_menu_enabled", {
		name: game.i18n.localize("RPGM.CONFIG.RADIAL_MENU_ENABLED"),
		hint: game.i18n.localize("RPGM.CONFIG.RADIAL_MENU_ENABLED_HINT"),
	})
}

/** Register shared settings menus on each module's settings page,
 * should be called after registering your own settings */
export function GlobalMenus(id: string) {
	game.settings.registerMenu(id, "secrets", {
		name: game.i18n.localize("RPGM.CONFIG.SECRETS_SETTINGS"),
		hint: game.i18n.localize("RPGM.CONFIG.SECRETS_SETTINGS_HINT"),
		label: game.i18n.localize("RPGM.CONFIG.SECRETS_SETTINGS"),
		icon: "fas fa-key",
		type: SecretsSettings,
		restricted: true,
	})
	game.settings.registerMenu(id, "radial-menu", {
		name: game.i18n.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS"),
		hint: game.i18n.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS_HINT"),
		label: game.i18n.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS"),
		icon: "fas dice-d20",
		type: RadialMenuSettings,
		restricted: true,
	})
}
