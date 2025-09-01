import type * as config from 'fvtt-types/configuration';

declare global {
	interface SettingConfig extends config.SettingConfig {
		'rpgm-forge.auto_name': boolean
		'rpgm-forge.rename_actors': boolean
		'rpgm-forge.language': string
		'rpgm-forge.system': string
		'rpgm-forge.genre': string
		'rpgm-forge.method': NamesOptions['method']
		'rpgm-forge.has_been_prompted': boolean
	}
}

export { };
