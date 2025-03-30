import { RadialMenuRegister } from "#/radial-menu"

interface RPGM {
	gameVersion: string
	majorGameVersion: number
	settings: {},
	radialMenu: RadialMenuRegister
	forge?: ForgeApi
	vault?: VaultApi
	tome?: TomeApi
}

declare global {
	var rpgm: RPGM

	interface globalThis {
		rpgm: RPGM
	}

	interface SettingConfig {
		'rpgm-tools.api_key': string
		'rpgm-tools.verbosity': string
		'rpgm-tools.radial_menu_enabled': string
	}

	namespace Hooks {
		interface StaticCallbacks {
			renderTokenHUD: (tokenHud: TokenHUD, html: HTMLElement, app: Application) => void
		}
	}
}

export { }
