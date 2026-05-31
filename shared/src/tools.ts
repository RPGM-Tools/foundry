import { AbstractTools } from '@rpgm/tools';
import { createGlobalState, useAsyncState } from '@vueuse/core';

import {
	ACCOUNT_SESSION_TOKEN_HEADER_NAME,
	consumeFoundryAccountSessionReturnFromUrl,
	readStoredFoundryAccountSessionToken
} from './auth/accountBridge';
import { auth } from './auth';
import { ChatCommands } from './chat';
import { Help } from './help';
import { FoundyRpgmModuleMixin } from './module';
import { RadialMenuRegister } from './radial-menu';
import { GlobalSettings } from './settings';
import { RpgmSidebarManager } from './sidebar';
import { api } from './style/theme';
import { usePolyhedriumBalance } from './util/usePolyhedriumBalance';

export class RpgmTools extends FoundyRpgmModuleMixin<
	typeof AbstractTools,
	AbstractTools.Settings
>(AbstractTools) {
	protected override get rpgmTextAiOptions(): {
		baseURL: string;
		apiKey: string;
	} {
		return {
			// Legacy `@rpgm/tools` still expects an auth token string here. During
			// the bridge release, old Forge feeds the Steward snapshot token through
			// a request wrapper so the managed text lane no longer depends on the
			// legacy Better Auth bearer token.
			apiKey: this.accountSessionToken || '',
			baseURL: __API_URL__
		};
	}
	override version: string = '0.0.0';

	auth = auth;

	/** The major game version of Foundry VTT, e.g., 11, 12, 13. */
	majorGameVersion: number;

	sidebar: RpgmSidebarManager;

	notification = api.notification;

	/** A record of all currently active and registered RPGM modules, keyed by their unique IDs. */
	modules: Partial<{
		[ID in keyof FoundryModuleMap]: InstanceType<FoundryModuleMap[ID]>;
	}> = {};

	/** Manages the registration and display of radial menu entries. */
	radialMenu: RadialMenuRegister;

	/** Manages chat commands registered by RPGM modules. */
	chat: ChatCommands;

	usePolyhedriumBalance = usePolyhedriumBalance;

	useUserInfo = createGlobalState(() => {
		const {
			isLoading,
			state: userInfo,
			execute: update
		} = useAsyncState(() => this.getApiUserInfo(), null, {
			immediate: false,
			resetOnExecute: false
		});
		return {
			isLoading,
			userInfo,
			update
		};
	});

	protected override init(): void | Promise<void> {
		consumeFoundryAccountSessionReturnFromUrl();
		globalThis.addEventListener?.('focus', () => {
			consumeFoundryAccountSessionReturnFromUrl();
		});
		globalThis.addEventListener?.('pageshow', () => {
			consumeFoundryAccountSessionReturnFromUrl();
		});
		globalThis.addEventListener?.('visibilitychange', () => {
			if (globalThis.document?.visibilityState === 'visible') {
				consumeFoundryAccountSessionReturnFromUrl();
			}
		});
		this.settings.get('textProviders');
		this.majorGameVersion = game.data.release.generation;
		this.client.interceptors.request.use(request => {
			return this.applyManagedAccountSessionHeaders(request);
		});
		this.chat = new ChatCommands();
		this.sidebar = new RpgmSidebarManager();
		this.radialMenu = new RadialMenuRegister();
	}

	private get accountSessionToken() {
		return readStoredFoundryAccountSessionToken();
	}

	private get managedApiOrigin() {
		return new URL(__API_URL__).origin;
	}

	private applyManagedAccountSessionHeaders(request: Request) {
		const accountSessionToken = this.accountSessionToken;

		if (!accountSessionToken) {
			return request;
		}

		const requestUrl = new URL(request.url);

		if (requestUrl.origin !== this.managedApiOrigin) {
			return request;
		}

		const requestHeaders = new Headers(request.headers);
		requestHeaders.delete('authorization');
		requestHeaders.set(
			ACCOUNT_SESSION_TOKEN_HEADER_NAME,
			accountSessionToken
		);

		return new Request(request, {
			headers: requestHeaders
		});
	}

	protected override registerSettings(): void | Promise<void> {
		GlobalSettings();
	}

	/**
	 * Localizes an RPGM-specific key.
	 * @param id - The localization key to localize
	 * @returns The localized string
	 */
	localize(id: RpgmLangs) {
		return game.i18n.localize(id);
	}

	// Keep this property for legacy compatibility, but source it from the
	// Steward-backed snapshot token so old Forge no longer depends on the
	// prior Better Auth token lane for managed requests.
	authToken = readStoredFoundryAccountSessionToken();

	help = new Help();

	protected override ready(): void | Promise<void> {
		rpgm.radialMenu.update();
		setTimeout(() => rpgm.chat.prune(), 4000);

		const center = (s: string) => {
			return s.padStart(s.length + Math.floor((48 - s.length) / 2));
		};

		const splitJustify = (s: string) => {
			const [left, right] = s.split('%s', 2) as
				| [string]
				| [string, string];
			const spaces = Math.floor(48 - left.length);
			return `${left}${right?.padStart(spaces) || ''} `;
		};
		const asciiArt = String.raw`
 ____  ____   ____ __  __  _              _
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___
| |_) | |_) | |  _| |/\| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
————————————————————————————————————————————————
${center('© 2025 RPGM Tools, LLC')}
${Object.values(rpgm.modules)
	.map(m => splitJustify(` ${m.icon} ${m.name} %s v${m.version} `))
	.join('\n')} `.slice(1);
		rpgm.logger
			.prefixed('')
			.styled('color: #d44e7b; font-weight: bold;')
			.log(asciiArt);
	}
}
