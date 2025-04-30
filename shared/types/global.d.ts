/* eslint-disable no-var */
import type { RpgmModule } from "#/module";

declare global {
	declare const __MODULE_VERSION__: string;

	interface RPGM extends object { }

	var rpgm: Partial<RPGM> & typeof RpgmModule;
	var game: ReadyGame;

	namespace Hooks {
		interface StaticCallbacks {
			renderTokenHUD: (tokenHud: TokenHUD, html: JQuery<HTMLElement>, app: Application) => void
			"rpgm-init": () => void
		}
	}
}

export { };
