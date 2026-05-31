/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
	AbstractRpgmModule,
	AbstractTools,
	IRpgmModule,
	ModuleMap
} from '@rpgm/tools';
import { RpgmLogger } from '@rpgm/tools';

import { LocalStorageMap } from './settings';
import { RpgmTools } from './tools';

type VoidPromise = void | Promise<void>;
type LegacyToolsRuntime = AbstractTools & {
	modules: Partial<{
		[ID in keyof FoundryModuleMap]: InstanceType<FoundryModuleMap[ID]>;
	}>;
	_init?: () => void | Promise<void>;
};
const LEGACY_NAMESPACE_RESERVED_KEYS = new Set([
	'constructor',
	'forge',
	'host',
	'signals'
]);

type AbstractConstructor<T> = abstract new (...args: any[]) => T;
export type FoundryRpgmModule = InstanceType<
	ReturnType<typeof FoundyRpgmModuleMixin>
>;

function isLegacyToolsRuntime(value: unknown): value is LegacyToolsRuntime {
	return Boolean(
		value &&
		typeof value === 'object' &&
		typeof (value as { textAiFromModel?: unknown }).textAiFromModel ===
			'function' &&
		typeof (value as { modules?: unknown }).modules === 'object'
	);
}

function resolveLegacyToolsRuntime(): LegacyToolsRuntime | undefined {
	if (isLegacyToolsRuntime(window.rpgmTools)) {
		return window.rpgmTools;
	}

	if (isLegacyToolsRuntime(window.rpgm)) {
		return window.rpgm;
	}

	return undefined;
}

function bridgeLegacyToolsRuntimeIntoNamespace(
	sharedNamespace: RPGM,
	toolsRuntime: LegacyToolsRuntime
) {
	if (sharedNamespace === toolsRuntime) {
		return;
	}

	const defineLegacyBridge = (
		propertyKey: string,
		descriptor: PropertyDescriptor
	) => {
		if (LEGACY_NAMESPACE_RESERVED_KEYS.has(propertyKey)) {
			return;
		}

		if ('value' in descriptor && typeof descriptor.value === 'function') {
			Object.defineProperty(sharedNamespace, propertyKey, {
				configurable: true,
				enumerable: descriptor.enumerable ?? true,
				value: descriptor.value.bind(toolsRuntime),
				writable: true
			});
			return;
		}

		Object.defineProperty(sharedNamespace, propertyKey, {
			configurable: true,
			enumerable: descriptor.enumerable ?? true,
			get: descriptor.get
				? descriptor.get.bind(toolsRuntime)
				: () =>
						(toolsRuntime as unknown as Record<string, unknown>)[
							propertyKey
						],
			set: descriptor.set
				? descriptor.set.bind(toolsRuntime)
				: (value: unknown) => {
						(toolsRuntime as unknown as Record<string, unknown>)[
							propertyKey
						] = value;
					}
		});
	};

	for (const [propertyKey, descriptor] of Object.entries(
		Object.getOwnPropertyDescriptors(toolsRuntime)
	)) {
		defineLegacyBridge(propertyKey, descriptor);
	}

	for (const [propertyKey, descriptor] of Object.entries(
		Object.getOwnPropertyDescriptors(Object.getPrototypeOf(toolsRuntime))
	)) {
		defineLegacyBridge(propertyKey, descriptor);
	}
}

export function FoundyRpgmModuleMixin<
	C extends AbstractConstructor<
		AbstractRpgmModule<Settings> & IRpgmModule<keyof ModuleMap, Settings>
	>,
	Settings extends AbstractRpgmModule.ModuleSettings
>(Base: C) {
	abstract class FoundryRpgmModule extends Base {
		readonly version = __MODULE_VERSION__;

		private static show(method: 'log' | 'warn' | 'error', message: string) {
			const notif = ui.notifications?.[
				method === 'log' ? 'info' : method
			](message, { console: false }) as
				| number
				| Notifications.Notification;
			if (typeof notif === 'number') {
				// Foundry V12
				(ui.notifications as any).element
					.find(`[data-id="${notif}"]`)
					.addClass('rpgm');
			} else {
				if (notif.element) {
					notif.element.classList.add('rpgm');
				}
			}
		}

		// ==== Instance ====

		override logger: RpgmLogger;

		override settings = new LocalStorageMap<Settings>(
			this.id,
			this.DEFAULT_SETTINGS
		);

		protected override get tools(): LegacyToolsRuntime {
			return (
				resolveLegacyToolsRuntime() ??
				(window.rpgm as unknown as LegacyToolsRuntime)
			);
		}

		protected bootstrap = Promise.resolve();

		constructor(..._args: any[]) {
			super();
			Hooks.once('init', () => {
				this.bootstrap = this.bootstrap.then(this._init.bind(this));
			});
			Hooks.once('setup', () => {
				this.bootstrap = this.bootstrap.then(this._setup.bind(this));
			});
			Hooks.once('ready', () => {
				this.bootstrap = this.bootstrap.then(this._ready.bind(this));
			});
		}

		private async _init() {
			this.logger = RpgmLogger.fromModule(this, {
				show: FoundryRpgmModule.show
			});
			let toolsRuntime = resolveLegacyToolsRuntime();
			const currentModuleIsToolsRuntime = isLegacyToolsRuntime(this);

			if (!toolsRuntime) {
				this.logger.debug('first');
				toolsRuntime = currentModuleIsToolsRuntime
					? this
					: (new RpgmTools() as unknown as LegacyToolsRuntime);
				window.rpgmTools = toolsRuntime;

				if (!window.rpgm) {
					window.rpgm = toolsRuntime as unknown as typeof window.rpgm;
				} else {
					bridgeLegacyToolsRuntimeIntoNamespace(
						window.rpgm,
						toolsRuntime
					);
				}

				if (!currentModuleIsToolsRuntime) {
					await toolsRuntime._init?.();
				}
			}
			this.logger
				.prefixed('')
				.log(`${this.icon} ${this.name} joined the game`);
			this.tools.modules[this.id] = this as any;
			await this.init();
		}

		protected init(): VoidPromise {}

		private async _setup() {
			this.registerSettings();
		}

		protected registerSettings(): VoidPromise {}

		private async _ready() {
			await this.ready();
		}

		protected ready(): VoidPromise {}

		override save(data: unknown): void {
			const dataString = JSON.stringify(data);
			localStorage.setItem(`${this.id}.settings`, dataString);
		}

		override load() {
			try {
				return JSON.parse(
					localStorage.getItem(`${this.id}.settings`) ?? 'null'
				);
			} catch {
				this.logger.error('Failed to load settings');
				return null;
			}
		}
	}
	return FoundryRpgmModule;
}
