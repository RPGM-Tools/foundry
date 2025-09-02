/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AbstractTools, RpgmModule as Module } from '@rpgm/tools';
import { RpgmLogger } from '@rpgm/tools';
import { toReactive } from '@vueuse/core';

import { GlobalMenus } from '#/settings';

import { RpgmTools } from './tools';

type VoidPromise = void | Promise<void>;
type AbstractConstructor<T> = (abstract new (...args: any[]) => T);
interface StaticFoundryRpgmModule extends Omit<typeof Module, 'prototype'> { }
type AbstractFoundryRpgmModule = AbstractConstructor<Module> & StaticFoundryRpgmModule;

export type FoundryModule = InstanceType<ReturnType<typeof FoundyRpgmModuleMixin>>;

export function FoundyRpgmModuleMixin<T extends AbstractFoundryRpgmModule>(Base: T) {
	abstract class FoundryRpgmModule extends Base {
		readonly version = __MODULE_VERSION__;

		private static show(method: 'log' | 'warn' | 'error', message: string) {
			ui.notifications?.[method === 'log' ? 'info' : method](message, { console: false });
		}

		// ==== Instance ====

		override logger: RpgmLogger;

		private _settings = ref({});
		override settings = toReactive(this._settings);

		protected override get tools() { return rpgm as AbstractTools; };

		protected bootstrap = Promise.resolve();

		constructor(..._args: any[]) {
			super();
			Hooks.once('init', () => { this.bootstrap = this.bootstrap.then(this._init.bind(this)); });
			Hooks.once('setup', () => { this.bootstrap = this.bootstrap.then(this._setup.bind(this)); });
			Hooks.once('ready', () => { this.bootstrap = this.bootstrap.then(this._ready.bind(this)); });
		}

		private async _init() {
			this.logger = RpgmLogger.fromModule(this, { show: FoundryRpgmModule.show });
			if (!globalThis.rpgm) {
				this.logger.debug('first');
				globalThis.rpgm = new RpgmTools();
				rpgm._init();
			}
			this.logger.prefixed('').log(`${this.icon} ${this.name} joined the game`);
			this._settings.value = this.load() ?? Base.DEFAULT_SETTINGS;
			rpgm.modules[this.id] = this;
			watch(this._settings, this.save.bind(this), { deep: true });
			await this.init();
		}

		protected init(): VoidPromise { }

		private async _setup() {
			this.registerSettings();
			GlobalMenus(this);
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
