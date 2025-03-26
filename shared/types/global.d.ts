interface RPGM {
	gameVersion: string
	majorGameVersion: number
	settings: {},
	forge?: ForgeApi
	vault?: VaultApi
	tome?: TomeApi
}

declare global {
	var rpgm: RPGM

	interface SettingConfig {
		'rpgm-tools.api_key': string
	}

	namespace Hooks {
		interface StaticCallbacks {
			renderTokenHUD: (tokenHud: TokenHUD, html: HTMLElement, app: Application) => void
		}
	}
}

export { }
