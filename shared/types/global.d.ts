/* eslint-disable no-var */
import type { RpgmModule } from "#/module";

declare global {
	declare const __MODULE_VERSION__: string;

	interface RPGM extends object { }

	var rpgm: Partial<RPGM> & typeof RpgmModule;
	var game: ReadyGame;

	interface CoreFlags {
		"rpgm-forge": string
	}

	namespace Hooks {
		interface StaticCallbacks {
			renderTokenHUD: (tokenHud: TokenHUD, html: JQuery<HTMLElement>, app: Application) => void
			renderChatMessageHTML: (message: ChatMessage, html: HTMLElement) => void
			"rpgm-init": () => void
		}
	}
}

export { };
