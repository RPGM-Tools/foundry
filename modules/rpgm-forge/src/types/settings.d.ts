import type * as config from "fvtt-types/configuration";

declare global {
	interface SettingConfig extends config.SettingConfig {
		"rpgm-forge.auto_name": boolean
		"rpgm-forge.rename_actors": boolean
	}
}

export { };
