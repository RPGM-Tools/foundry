import { AbstractTools } from '@rpgm/tools';

import { auth } from './auth';
import { ChatCommands } from './chat';
import { FoundyRpgmModuleMixin } from './module';
import { RadialMenuRegister } from './radial-menu';
import { GlobalSettings } from './settings';
import { RpgmSidebarManager } from './sidebar';
import { rpgmPolyhedriumBalance } from './util/usePolyhedriumBalance';

export class RpgmTools extends FoundyRpgmModuleMixin<typeof AbstractTools, AbstractTools.Settings>(AbstractTools) {
	protected override get rpgmTextAiOptions(): { baseURL: string; apiKey: string; } {
		return {
			apiKey: this.authToken || '',
			baseURL: __API_URL__ + '/api/forge'
		};
	}
	override version: string = '0.0.0';

	auth = auth;

	/** The major game version of Foundry VTT, e.g., 11, 12, 13. */
	majorGameVersion: number;

	sidebar: RpgmSidebarManager;

	/** A record of all currently active and registered RPGM modules, keyed by their unique IDs. */
	modules: Partial<{ [ID in keyof FoundryModuleMap]: InstanceType<FoundryModuleMap[ID]> }> = {};

	/** Manages the registration and display of radial menu entries. */
	radialMenu: RadialMenuRegister;

	/** Manages chat commands registered by RPGM modules. */
	chat: ChatCommands;

	usePolyhedriumBalance: ReturnType<typeof rpgmPolyhedriumBalance>;

	protected override init(): void | Promise<void> {
		this.settings.get('textProviders');
		this.usePolyhedriumBalance = rpgmPolyhedriumBalance();
		this.majorGameVersion = game.data.release.generation;
		this.chat = new ChatCommands();
		this.sidebar = new RpgmSidebarManager();
		this.radialMenu = new RadialMenuRegister();
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

	authToken = localStorage.getItem('rpgm-token');

	protected override ready(): void | Promise<void> {
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
		rpgm.logger.prefixed('').styled('color: #d44e7b; font-weight: bold;').log(asciiArt);
	}
}
