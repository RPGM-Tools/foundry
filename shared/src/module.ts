/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AbstractRpgmModule, AbstractTools, IRpgmModule, ModuleMap } from '@rpgm/tools';
import { RpgmLogger } from '@rpgm/tools';

import { LocalStorageMap } from './settings';
import { RpgmTools } from './tools';

type VoidPromise = void | Promise<void>;

type AbstractConstructor<T> = abstract new (...args: any[]) => T;
export type FoundryRpgmModule = InstanceType<ReturnType<typeof FoundyRpgmModuleMixin>>;

export function FoundyRpgmModuleMixin<C extends AbstractConstructor<AbstractRpgmModule<Settings> & IRpgmModule<keyof ModuleMap, Settings>>, Settings extends AbstractRpgmModule.ModuleSettings>(Base: C) {
	abstract class FoundryRpgmModule extends Base {
		readonly version = __MODULE_VERSION__;

		private static show(method: 'log' | 'warn' | 'error', message: string) {
			const notif = ui.notifications?.[method === 'log' ? 'info' : method](message, { console: false }) as number | Notifications.Notification;
			if (typeof notif === 'number') {
				// Foundry V12
				(ui.notifications as any).element.find(`[data-id="${notif}"]`).addClass('rpgm');
			} else {
				if (notif.element) {
					notif.element.classList.add('rgpm');
				}
			}
		}

		// ==== Instance ====

		override logger: RpgmLogger;

		override settings = new LocalStorageMap<Settings>(this.id, this.DEFAULT_SETTINGS);

		protected override get tools() { return window.rpgm as unknown as AbstractTools; };

		protected bootstrap = Promise.resolve();

		constructor(..._args: any[]) {
			super();
			Hooks.once('init', () => { this.bootstrap = this.bootstrap.then(this._init.bind(this)); });
			Hooks.once('setup', () => { this.bootstrap = this.bootstrap.then(this._setup.bind(this)); });
			Hooks.once('ready', () => { this.bootstrap = this.bootstrap.then(this._ready.bind(this)); });
		}

		private async _init() {
			this.logger = RpgmLogger.fromModule(this, { show: FoundryRpgmModule.show });
			if (!window.rpgm) {
				this.logger.debug('first');
				window.rpgm = new RpgmTools();
				rpgm._init();
			}
			this.logger.prefixed('').log(`${this.icon} ${this.name} joined the game`);
			rpgm.modules[this.id] = this as any;
			await this.init();
		}

		protected init(): VoidPromise { }

		private async _setup() {
			this.registerSettings();
		}

		protected registerSettings(): VoidPromise { }

		private async _ready() {
			await this.ready();
		}

		protected ready(): VoidPromise { }

		override save(data: unknown): void {
			const dataString = JSON.stringify(data);
			localStorage.setItem(`${this.id}.settings`, dataString);
		}

		override load() {
			try {
				return JSON.parse(localStorage.getItem(`${this.id}.settings`) ?? 'null');
			} catch {
				this.logger.error('Failed to load settings');
				return null;
			}
		}
	}
	return FoundryRpgmModule;
}
