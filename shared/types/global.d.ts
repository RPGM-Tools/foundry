/* eslint-disable no-var */
import type { App } from "vue";

import type { RpgmModule } from "#/module";
import type RpgmSidebar from "#/sidebar/modern";

declare global {
	declare const __MODULE_VERSION__: string;
	declare const __XSOLLA_PROJECT_ID__: string;

	interface RPGM extends object { }

	interface HookConfig {
		renderTokenHUD: (tokenHud: TokenHUD, html: JQuery<HTMLElement> | HTMLElement, app: Application) => void
		test: (tokenHud: TokenHUD, html: JQuery<HTMLElement> | HTMLElement, app: Application) => void
	}

	/**
	 * Our global singleton object
	 * Essentially the static instance of {@link RpgmModule}
	 */
	var rpgm: RPGM & typeof RpgmModule;
	var game: ReadyGame;

	type SidebarMenu = {
		id: string;
		title: string;
		color: string;
		icon: string;
		component?: Component;
	}

	interface FlagConfig {
		ChatMessage: {
			[key in foundry.helpers.ClientSettings.Namespace]
		}
	}

	namespace Hooks {
		interface StaticCallbacks {
			renderTokenHUD: (tokenHud: TokenHUD, html: JQuery<HTMLElement> | HTMLElement, app: Application) => void
			renderSettingsConfig: (settingsConfig: SettingsConfig, html: JQuery<HTMLElement> | HTMLElement, app: Application) => void
			renderChatMessageHTML: (message: ChatMessage, html: HTMLElement, context: object) => void
			"rpgm-init": () => void
			createToken(tokenDocument: TokenDocument, scene: foundry.abstract.types.DatabaseUpdateOperation, userId: string): void
		}

		interface AllHooks {
			renderTokenHUD: (tokenHud: TokenHUD, html: JQuery<HTMLElement> | HTMLElement, app: Application) => void
			test: (tokenHud: TokenHUD, html: JQuery<HTMLElement> | HTMLElement, app: Application) => void
		}
	}

	interface CONFIG {
		RpgmSidebar: {
			sidebarIcon: string
			documentClass: typeof RpgmSidebar
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
