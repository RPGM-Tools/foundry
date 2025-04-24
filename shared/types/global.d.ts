/* eslint-disable no-var */
import type { RadialMenuRegister } from "#/radial-menu";
import type { ChatCommands } from "#/chat";
import type { RPGMLogger } from "#/util/logging";

interface RPGM {
	gameVersion: string
	majorGameVersion: number
	radialMenu: RadialMenuRegister
	chatCommands: ChatCommands
	logger: RPGMLogger
	localize: (id: RpgmLangs) => string
	forge?: ForgeApi
	vault?: VaultApi
	tome?: TomeApi
}

declare global {
	declare const __RPGM_MODULE__: string;
	interface DRef<T> {
		get value(): T
		set value(value: T)
	}

	var rpgm: RPGM;
	var game: ReadyGame;

	namespace Hooks {
		interface StaticCallbacks {
			renderTokenHUD: (tokenHud: TokenHUD, html: JQuery<HTMLElement>, app: Application) => void
			"rpgm-init": () => void
		}
	}
}

export { };
