import type { RpgmModule as Module } from '@rpgm/tools';
import { RpgmLogger } from '@rpgm/tools';

import { GlobalMenus, GlobalSettings } from '#/settings';
import { rpgmPolyhedriumBalance } from '#/util/usePolyhedriumBalance';

import { auth as rpgmAuth } from './auth';
import { ChatCommands } from './chat';
import { RadialMenuRegister } from './radial-menu';
import { RpgmSidebarManager } from './sidebar';
import { localize } from './util/localize';
import { RpgmTools } from './tools';
import { toReactive } from '@vueuse/core';

type VoidPromise = void | Promise<void>;
type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;

export function FoundyRpgmModuleMixin<T extends AbstractConstructor<Module>>(Base: T) {
	abstract class FoundryRpgmModule extends Base {
		// ==== Static ===

		/** The major game version of Foundry VTT, e.g., 11, 12, 13. */
		static majorGameVersion: number;

		/** Manages chat commands registered by RPGM modules. */
		static chat: ChatCommands;

		/** Manages the registration and display of radial menu entries. */
		static radialMenu: RadialMenuRegister;

		/** A record of all currently active and registered RPGM modules, keyed by their unique IDs. */
		static modules: Record<FoundryRpgmModule['id'], FoundryRpgmModule> = {};

		/** Utility function for localizing strings using Foundry's localization system. */
		static localize = localize;

		static sidebar: RpgmSidebarManager;

		static auth = rpgmAuth;

		static usePolyhedriumBalance: ReturnType<typeof rpgmPolyhedriumBalance>;

		readonly version = __MODULE_VERSION__;

		protected static show(method: 'log' | 'warn' | 'error', message: string) {
			ui.notifications?.[method === 'log' ? 'info' : method](message, { console: false });
		}

		static j(el: JQuery<HTMLElement> | HTMLElement): HTMLElement {
			return el instanceof HTMLElement ? el : el[0] as HTMLElement;
		}

		static settings = (id: string) => ({
			load: () => {
				try {
					return JSON.parse(localStorage.getItem(`${id}.settings`) ?? 'null');
				} catch {
					return null;
				}
			},
			save: (data: object) => {
				const dataString = JSON.stringify(data);
				localStorage.setItem(`${id}.settings`, dataString);
			}
		});

		static tools: RpgmTools;

		// ==== Instance ====

		override logger = RpgmLogger.fromModule(this, { show: FoundryRpgmModule.show });

		protected first: boolean = false;

		private _settings = ref({});
		override settings = toReactive(this._settings);

		protected override get tools() { return FoundryRpgmModule.tools; };

		private bootstrap = Promise.resolve();

		constructor(...args: any[]) {
			super(args);
			Hooks.once('init', () => { this.bootstrap = this.bootstrap.then(this._init.bind(this)); });
			Hooks.once('setup', () => { this.bootstrap = this.bootstrap.then(this._setup.bind(this)); });
			Hooks.once('ready', () => { this.bootstrap = this.bootstrap.then(this._ready.bind(this)); });
		}

		private async initGlobal() {
			this.first = true;
			globalThis.rpgm = FoundryRpgmModule as unknown as typeof globalThis.rpgm;
			FoundryRpgmModule.tools = new RpgmTools();
			FoundryRpgmModule.tools._init();
			FoundryRpgmModule.majorGameVersion = game.data.release.generation;
			FoundryRpgmModule.radialMenu = new RadialMenuRegister();
			FoundryRpgmModule.chat = new ChatCommands();
			FoundryRpgmModule.tools.logger.prefixed('').log('🛠️ RPGM Tools joined the game');
			FoundryRpgmModule.sidebar = new RpgmSidebarManager();
			FoundryRpgmModule.usePolyhedriumBalance = rpgmPolyhedriumBalance();
			GlobalSettings();
		}

		private async _init() {
			if (!globalThis.rpgm) {
				this.initGlobal();
			}
			this.logger.prefixed('').log(`${this.icon} ${this.name} joined the game`);
			this._settings.value = this.load();
			rpgm.modules[this.id] = this;
			this.logger.warn(this._settings.value);
			watch(this._settings, this.save.bind(this), { deep: true });
			await this.init();
			this.logger = RpgmLogger.fromModule(this, { show: FoundryRpgmModule.show });
		}

		protected init(): VoidPromise { }

		private async _setup() {
			this.registerSettings();
			GlobalMenus(this.id);
		}

		protected registerSettings(): VoidPromise { }

		private async _ready() {
			if (this.first) {
				FoundryRpgmModule.globalReady();
			}
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

		static globalReady() {
			rpgm.radialMenu.update();
			rpgm.chat.prune();

			const center = (s: string) => {
				return s.padStart(s.length + Math.floor((48 - s.length) / 2));
			};

			const splitJustify = (s: string) => {
				const [left, right] = s.split('%s', 2) as [string] | [string, string];
				const spaces = Math.floor(48 - left.length);
				return `${left}${right?.padStart(spaces) || ''} `;
			};
			const asciiArt = (String.raw`
 ____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |/\| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
————————————————————————————————————————————————
${center('© 2025 RPGM Tools, LLC')}
${Object.values(rpgm.modules).map(m => splitJustify(` ${m.icon} ${m.name} %s v${m.version} `)).join('\n')} `).slice(1);
			rpgm.tools.logger.prefixed('').styled('color: #d44e7b; font-weight: bold;').log(asciiArt);
		}

	}
	return FoundryRpgmModule;
}
