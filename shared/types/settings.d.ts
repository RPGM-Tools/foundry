import type * as config from 'fvtt-types/configuration';

declare global {
	interface SettingConfig extends config.SettingConfig {
		'rpgm-tools.api_key': string
		'rpgm-tools.radial_menu_input': boolean
		'rpgm-tools.radial_menu_hud': boolean
		'rpgm-tools.verbose-logs': boolean
		'rpgm-tools.radial_menu_debug': boolean
	}
}
export { };
