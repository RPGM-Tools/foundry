import { GlobalMenus, GlobalSettings } from "#/settings";
import { ChatCommands } from "./chat";
import { RadialMenuRegister } from "./radial-menu";
import { localize } from "./util/localize";
import { RPGMLogger } from "./util/logging";

export abstract class RpgmModule {
	static majorGameVersion: number;
	static logger: RPGMLogger;
	static chat: ChatCommands;
	static radialMenu: RadialMenuRegister;
	static modules: Record<string, RpgmModule> = {};
	static localize = localize;

	/** Slug id for this module */
	abstract readonly id: string;
	/** Display name for this module */
	abstract readonly name: string;
	abstract readonly logger: RPGMLogger;
	/** 
	 *	Version of this module 
	 *	Note - this is in the abstract class because the string is replaced at build time
	 *	Technically, each module bundles its own abstract RpgmModule
	 */
	readonly version = __MODULE_VERSION__;
	/** Was this the module to initialize RPGM? */
	private first = false;

	constructor() {
		Hooks.once("init", () => void this._init());
		Hooks.once("i18nInit", () => void this._i18nInit());
		Hooks.once("ready", () => void this._ready());
	}

	private async _init() {
		if (!globalThis.rpgm)
			this.initGlobal();
		this.logger.logF("color: #ad8cef; font-weight: bold;", "", `${this.name} joined the game`);
		rpgm.modules[this.id] = this;
		await this.init();
		await this.registerSettings();
		GlobalMenus(this.id);
	}

	private initGlobal() {
		this.first = true;
		globalThis.rpgm = RpgmModule;
		RpgmModule.logger = new RPGMLogger("🛠️ RPGM Tools");
		RpgmModule.radialMenu = new RadialMenuRegister();
		RpgmModule.chat = new ChatCommands();
		RpgmModule.majorGameVersion = game.data.release.generation;
		GlobalSettings();
	}

	abstract init(): Promise<void> | void

	abstract registerSettings(): Promise<void> | void

	private async _i18nInit() {
		await this.i18nInit();
	}

	abstract i18nInit(): Promise<void> | void

	protected async _ready() {
		if (this.first)
			this.globalReady();
		await this.rpgmReady();
	}

	abstract rpgmReady(): Promise<void> | void

	private globalReady() {
		rpgm.radialMenu.update();
		const asciiArt = (String.raw`
 ____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |\/| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
————————————————————————————————————————————————
${Object.values(rpgm.modules).map(m => `‣ ${m.name} - v${m.version}`).join('\n')}`).slice(1);

		rpgm.logger.logF("color: #d44e7b; font-weight: bold;", "", asciiArt);
	}
}
