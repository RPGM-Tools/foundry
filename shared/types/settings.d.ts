import type * as config from 'fvtt-types/configuration';

declare global {
	interface SettingConfig extends config.SettingConfig {
		'rpgm-tools.radial_menu_input': boolean
		'rpgm-tools.radial_menu_hud': boolean
		'rpgm-tools.radial_menu_debug': boolean
		'rpgm-tools.login-token': string
	}
}
export { };
