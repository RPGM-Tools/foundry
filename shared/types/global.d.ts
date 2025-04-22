import type { RadialMenuRegister } from "#/radial-menu"
import { ChatCommands } from "@/chat"
import type { RPGMLogger } from "@/util/logging"

interface RPGM {
	gameVersion: string
	majorGameVersion: number
	settings: {},
	radialMenu: RadialMenuRegister
	chatCommands: ChatCommands
	logger: RPGMLogger
	forge?: ForgeApi
	vault?: VaultApi
	tome?: TomeApi
}

declare global {
	interface DRef<T> {
		get value(): T
		set value(value: T)
	}

	var rpgm: RPGM

	interface globalThis {
		rpgm: RPGM
	}

	interface SettingConfig {
		'rpgm-tools.api_key': string
		'rpgm-tools.verbosity': string
		'rpgm-tools.radial_menu_enabled': boolean
		'rpgm-tools.debug_mode': boolean
	}

	namespace Hooks {
		interface StaticCallbacks {
			renderTokenHUD: (tokenHud: TokenHUD, html: JQuery<HTMLElement>, app: Application) => void
		}
	}
}

export { }
