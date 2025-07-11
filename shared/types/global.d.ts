/* eslint-disable no-var */
import type { RpgmModule } from "#/module";
import { MaybePromise } from "fvtt-types/utils";
import type { App } from "vue";

declare global {
	declare const __MODULE_VERSION__: string;

	interface RPGM extends object { }

	/**
	 * Our global singleton object
	 * Essentially the static instance of {@link RpgmModule}
	 */
	var rpgm: RPGM & typeof RpgmModule;
	var game: ReadyGame;

	interface CoreFlags {
		"rpgm-forge": string
	}

	namespace Hooks {
		interface StaticCallbacks {
			// renderTokenHUD: (tokenHud: TokenHUD, html: JQuery<HTMLElement> | HTMLElement, app: Application) => void
			renderSettingsConfig: (settingsConfig: SettingsConfig, html: JQuery<HTMLElement> | HTMLElement, app: Application) => void
			renderChatMessageHTML: (message: ChatMessage, html: HTMLElement, context: object) => void
			"rpgm-init": () => void
			createToken(tokenDocument: TokenDocument, scene: foundry.abstract.types.DatabaseUpdateOperation, userId: string): void
		}
	}

	namespace CONFIG {
		interface UI {
			rpgm: foundry.applications.sidebar.AbstractSidebarTab
		}
	}

	/**
	 * Override for injecting the Radial Menu into TokenHUD
	 */
	interface TokenHUD {
		menuApp: App
	}

	type RenderData = {
		cssClass?: string,
		cssId: string,
		tabName?: string,
	}

	interface Application {
		thing: number
	}

	interface ChatLog {
		_getEntryContextOptions(): {
			name: string,
			icon: string,
			condition: (li: JQuery | HTMLElement) => boolean
			callback: (message: ChatMessage) => void
		}[]
	}
}

export { };
