import type * as config from "fvtt-types/configuration";

declare global {
	interface SettingConfig extends config.SettingConfig {
		'rpgm-forge.names': Record<string, ForgeChatNames>
		'rpgm-forge.description': Record<string, ForgeChatDescription>
	}
}

export { };
