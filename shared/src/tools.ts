import type { ProviderV2 } from '@ai-sdk/provider';
import {
	createOpenAICompatible,
	OpenAICompatibleChatLanguageModel,
	type OpenAICompatibleProvider
} from '@ai-sdk/openai-compatible';
import { createGlobalState, useAsyncState } from '@vueuse/core';
import { err, ok } from 'neverthrow';

import {
	ACCOUNT_SESSION_TOKEN_HEADER_NAME,
	consumeFoundryAccountSessionReturnFromUrl,
	readStoredFoundryAccountSessionToken
} from './auth/accountBridge';
import { auth } from './auth';
import { ChatCommands } from './chat';
import { client } from './client/client.gen';
import {
	getApiListProducts,
	getApiPolyhedrium,
	getApiUserInfo
} from './client';
import { Help } from './help';
import {
	AbstractRpgmModule,
	FoundyRpgmModuleMixin,
	type IRpgmModule
} from './module';
import { RadialMenuRegister } from './radial-menu';
import { RpgmLogger } from './logger';
import { GlobalSettings } from './settings';
import { RpgmSidebarManager } from './sidebar';
import { api } from './style/theme';
import { usePolyhedriumBalance } from './util/usePolyhedriumBalance';

export namespace AbstractTools {
	export interface Settings extends AbstractRpgmModule.ModuleSettings {
		textProviders: TextProvider[];
	}
}

export type RpgmModels =
	| 'rpgm-names'
	| 'rpgm-descriptions'
	| 'rpgm-homebrew';

type Options = {
	name: string;
	baseURL: string;
	apiKey: string;
};

export type TextModel = Model<'text'>;

export type Model<T extends string> = {
	type: T;
	provider: string;
	slug: RpgmModels | (string & {});
};

interface ProviderDef {
	name: string;
	classIcon: string;
	create(this: AbstractTools, options: Options): ProviderV2;
	fetchModels?: (options: Pick<Options, 'apiKey' | 'baseURL'>) => Promise<string[]>;
}

export const DIY_PROVIDERS: Record<string, ProviderDef> = {
	'openai-compatible': {
		name: 'OpenAI Compatible',
		classIcon: 'fa-solid fa-sparkles',
		create({ apiKey, baseURL, name }) {
			return createOpenAICompatible({ apiKey, baseURL, name });
		},
		fetchModels: ({ apiKey, baseURL }) =>
			fetch(
				new URL('models', baseURL += baseURL.endsWith('/') ? '' : '/'),
				{
					headers: { Authorization: `Bearer ${apiKey}` }
				}
			)
				.then(response => response.json())
				.then(result => result.data.map((model: { id: string }) => model.id))
	}
} as const;

export const PROVIDERS: Record<string, ProviderDef> = {
	'rpgm-tools': {
		name: 'RPGM Tools',
		classIcon: 'rp-dice',
		create() {
			return this.rpgmTextAi();
		}
	},
	offline: {
		name: 'Offline',
		classIcon: 'fa-solid fa-wifi-slash',
		create() {
			return this.rpgmTextAi();
		}
	},
	...DIY_PROVIDERS
} as const;

export interface TextProvider {
	id: string;
	name: string;
	type: string;
	baseURL: string;
	apiKey: string;
	textModels: string[];
	hue: string;
}

export abstract class AbstractTools
	extends AbstractRpgmModule<AbstractTools.Settings>
	implements IRpgmModule<'rpgm-tools', AbstractTools.Settings>
{
	DEFAULT_SETTINGS = {
		textProviders: []
	};

	name = 'RPGM Tools';
	id = 'rpgm-tools' as const;
	icon = '🛠️';
	logger = RpgmLogger.fromModule(this);

	textAiFromModel(model: TextModel) {
		const { provider, slug } = model;
		if (provider === 'rpgm-tools') {
			return ok(this.rpgmTextAi()(model.slug as RpgmModels));
		}

		const providerDefinition = this.settings
			.get('textProviders')
			?.find(candidate => candidate.id === provider);
		if (!providerDefinition) {
			return err(new Error(`Unknown provider: ${provider}`));
		}

		return ok(this.textAi(providerDefinition, slug));
	}

	textAi(provider: TextProvider, slug: string) {
		const { name, type, apiKey, baseURL } = provider;
		const providerFactory = PROVIDERS[type].create.call(this, {
			apiKey,
			baseURL,
			name
		});
		return providerFactory.languageModel(slug);
	}

	readonly client = client;

	getApiPolyhedrium = getApiPolyhedrium;
	getApiUserInfo = getApiUserInfo;
	getApiListProducts = getApiListProducts;

	protected abstract get rpgmTextAiOptions(): {
		baseURL: string;
		apiKey: string;
	};

	rpgmTextAi(): OpenAICompatibleProvider<RpgmModels, never, never, never> {
		const { baseURL, apiKey } = this.rpgmTextAiOptions;
		return createOpenAICompatible({
			name: 'rpgm',
			baseURL: new URL('/api/forge', baseURL).href,
			apiKey
		});
	}

	constructor() {
		super();
		this.initClient();
	}

	private initClient() {
		this.client.setConfig({
			auth: () => this.rpgmTextAiOptions.apiKey,
			baseUrl: this.rpgmTextAiOptions.baseURL
		});
	}
}

const originalDoGenerate = OpenAICompatibleChatLanguageModel.prototype.doGenerate;
const patchedDoGenerate: typeof originalDoGenerate = async function (
	this: OpenAICompatibleChatLanguageModel,
	...args: Parameters<typeof originalDoGenerate>
) {
	(this.supportsStructuredOutputs as boolean) = true;
	return originalDoGenerate.apply(this, args);
};

OpenAICompatibleChatLanguageModel.prototype.doGenerate = patchedDoGenerate;

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
