import { GlobalMenus, GlobalSettings } from "#/settings";
import { ChatCommands } from "./chat";
import { RadialMenuRegister } from "./radial-menu";
import { localize } from "./util/localize";
import { RPGMLogger } from "./util/logging";

/**
 * Abstract class for representing an RPGM Module
 *
 * Lifecycle:
 * 1. init
 * 2. registerSettings
 * 3. i18nInit
 * 4. ready
 */
export abstract class RpgmModule {
	static majorGameVersion: number;
	/** Generic logger for RPGM Tools */
	static logger: RPGMLogger;
	static chat: ChatCommands;
	static radialMenu: RadialMenuRegister;
	static modules: Record<string, RpgmModule> = {};
	static localize = localize;

	/** Slug id for this module, equal to this module's id */
	abstract readonly id: string;
	/** Display name for this module */
	abstract readonly name: string;
	abstract readonly icon: string;
	abstract readonly logger: RPGMLogger;
	/** 
	 * Version of this module 
	 * Note - this is in the abstract class because the string is replaced at build time
	 * Technically, each module bundles its own abstract RpgmModule
	 */
	readonly version = __MODULE_VERSION__;
	/** Was this the module to initialize RPGM? */
	private first = false;

	constructor() {
		Hooks.once("init", () => void this._init());
		Hooks.once("i18nInit", () => void this._i18nInit());
		Hooks.once("ready", () => void this._ready());
	}

	/** 
	 * Very first code that gets run for a module
	 * Calls {@link initGlobal} if this is our first module to be loaded
	 * Among other things, registers the shared menus used by all modules
	 */
	private async _init() {
		if (!globalThis.rpgm)
			this.initGlobal();
		this.logger.logF("color: #ad8cef; font-weight: bold;", "", `${this.icon} ${this.name} joined the game`);
		rpgm.modules[this.id] = this;
		await this.init();
		await this.registerSettings();
		GlobalMenus(this.id);
	}

	/** 
	 * Sets up the {@link rpgm} singleton object
	 */
	private initGlobal() {
		this.first = true;
		globalThis.rpgm = RpgmModule;
		RpgmModule.majorGameVersion = game.data.release.generation;
		RpgmModule.logger = new RPGMLogger("🛠️ RPGM Tools");
		RpgmModule.radialMenu = new RadialMenuRegister();
		RpgmModule.chat = new ChatCommands();
		RpgmModule.logger.logF("color: #ad8cef; font-weight: bold;", "", `🛠️ RPGM Tools joined the game`);
		Hooks.on("renderSettingsConfig", (_, html) => {
			Object.keys(RpgmModule.modules).forEach(k => {
				const settingsHtml = html instanceof HTMLElement ? html : html[0];
				const screen = settingsHtml.querySelector(`[data-category="${k}"]`) as HTMLElement;
				screen.style.height = "100%";
				screen.style.display = "flex";
				screen.style.flexDirection = "column";
				// Move all menus to the bottom of the page
				screen?.querySelectorAll(`.form-group.submenu,.form-group:has([data-action="openSubmenu"])`).forEach(s => screen.appendChild(s));
				const copyright = document.createElement("i");
				copyright.style.marginTop = "auto";
				copyright.style.textAlign = "center";
				copyright.innerText = "© 2025 RPGM Tools, LLC";
				screen?.appendChild(copyright);
			});
		});
		GlobalSettings();
	}

	/**
	 * Called before everything else
	 * Not much goes on in here
	 */
	init(): Promise<void> | void { }

	/**
	 * Register module-specific settings here
	 * Also where Radial Menu buttons and RP-Commands are registered (might change)
	 */
	registerSettings(): Promise<void> | void { }

	/**
	 * Private caller of {@link i18nInit}
	 */
	private async _i18nInit() {
		await this.i18nInit();
	}

	/**
	 * Called after localizations have initialized
	 */
	i18nInit(): Promise<void> | void { }

	/**
	 * Private caller of {@link rpgmReady}
	 */
	protected async _ready() {
		if (this.first)
			RpgmModule.globalReady();
		await this.rpgmReady();
	}

	/**
	 * Called when everything else in Foundry is loaded
	 */
	rpgmReady(): Promise<void> | void { }

	/** 
	 * Called once when everything else in Foundry is loaded
	 */
	static globalReady() {
		rpgm.radialMenu.update();
		const asciiArt = (String.raw`
 ____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |\/| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
————————————————————————————————————————————————
${Object.values(rpgm.modules).map(m => `‣ ${m.icon} ${m.name} – v${m.version}`).join('\n')}`).slice(1);

		rpgm.logger.logF("color: #d44e7b; font-weight: bold;", "", asciiArt);
	}
}
