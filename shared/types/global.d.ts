/* eslint-disable no-var */
import type { RadialMenuRegister } from "#/radial-menu";
import type { ChatCommands } from "#/chat";
import type { RPGMLogger } from "#/util/logging";
import type { RpgmModule } from "#/module";

type ModulesList<T = RpgmModule> = Record<T['id'], T>;

declare global {
	interface RPGM {
		gameVersion: string
		majorGameVersion: number
		radialMenu: RadialMenuRegister
		chat: ChatCommands
		modules: ModulesList
		logger: RPGMLogger
		localize: (id: RpgmLangs) => string
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
