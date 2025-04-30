import { GlobalInit, GlobalMenus, GlobalSettings } from "#/settings";

export abstract class RpgmModule {
	/** Slug id for this module */
	abstract readonly id: string;
	/** Display name for this module */
	abstract readonly name: string;
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
		rpgm.logger.log(`${this.name} joins the game.`);
		rpgm.modules[this.id] = this;
		await this.init();
		await this.registerSettings();
		GlobalMenus(this.id);
	}

	private initGlobal() {
		this.first = true;
		GlobalInit();
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
		const asciiArt = String.raw`
________________________________________________
_____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |\/| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
________________________________________________
${Object.values(rpgm.modules).map(m => `‣ ${m.name}`).join('\n')}`;

		rpgm.logger.logF("color: #d44e7b; font-weight: bold;", asciiArt);
	}
}
