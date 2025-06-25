import { GlobalMenus, GlobalSettings } from "#/settings";
import { ChatCommands } from "./chat";
import { registerRpgmCommands } from "./chat/commands";
import { RadialMenuRegister } from "./radial-menu";
// import { initSidebar } from "./sidebar";
import { localize } from "./util/localize";
import { RPGMLogger } from "./util/LoggingV2";

/**
 * Abstract base class for all RPGM (Role-Playing Game Master) modules.
 *
 * This class defines the core lifecycle and shared functionalities for modules within the RPGM Tools ecosystem.
 * Modules extend this class to integrate with the system, register settings, commands, and hooks.
 *
 * The module lifecycle follows a distinct order, orchestrated by Foundry VTT hooks and internal promises:
 * 1. `init`: (Foundry's `init` hook) - Initial setup, global singleton initialization (`rpgm`), and module instance registration.
 * 2. `setup`: (Foundry's `setup` hook) - Module-specific settings registration, global menu setup, and chat command registration.
 * 3. `ready`: (Foundry's `ready` hook) - Final initialization, global ready tasks, and module-specific ready tasks.
 */
export abstract class RpgmModule {
	/** The major game version of Foundry VTT, e.g., 11, 12, 13. */
	static majorGameVersion: number;
	/** A generic logger instance for logging messages from RPGM Tools. */
	static logger: RPGMLogger;
	/** Manages chat commands registered by RPGM modules. */
	static chat: ChatCommands;
	/** Manages the registration and display of radial menu entries. */
	static radialMenu: RadialMenuRegister;
	/** A record of all currently active and registered RPGM modules, keyed by their unique IDs. */
	static modules: Record<string, RpgmModule> = {};
	/** Utility function for localizing strings using Foundry's localization system. */
	static localize = localize;

	/**
	 * The unique slug ID for this module, which also serves as its namespace for client settings.
	 * This must be defined by the extending module.
	 */
	abstract readonly id: ClientSettings.Namespace;
	/**
	 * The user-friendly display name for this module.
	 * This must be defined by the extending module.
	 */
	abstract readonly name: string;
	/**
	 * An icon string (e.g., a Unicode emoji) representing this module, used in logs and UI.
	 * This must be defined by the extending module.
	 */
	abstract readonly icon: string;
	/**
	 * An instance-specific logger for this module. Each module should have its own logger for clear output.
	 * This must be defined by the extending module, typically by initializing it in the module's constructor.
	 */
	abstract readonly logger: RPGMLogger;
	/** 
	 * The version string of this module.
	 * This value is typically replaced during the build process with the actual module version.
	 * Although declared in the abstract class, each bundled module will have its specific version embedded here.
	 */
	readonly version = __MODULE_VERSION__;
	/** 
	 * A flag indicating if this was the first RPGM module to initialize,
	 * thereby triggering the setup of the global `rpgm` singleton.
	 */
	private first = false;

	/** 
	 * A Promise chain that ensures asynchronous lifecycle hooks (`_init`, `_setup`, `_ready`)
	 * are executed sequentially and in the correct order.
	 */
	private setup = Promise.resolve();

	/**
	 * Constructs an `RpgmModule` instance.
	 * Registers Foundry VTT's `init`, `setup`, and `ready` hooks to orchestrate the module's lifecycle methods.
	 * Each hook adds its corresponding private method (`_init`, `_setup`, `_ready`) to the `setup` promise chain.
	 */
	constructor() {
		Hooks.once("init", () => this.setup = this.setup.then(this._init.bind(this)));
		Hooks.once("setup", () => this.setup = this.setup.then(this._setup.bind(this)));
		Hooks.once("ready", () => this.setup = this.setup.then(this._ready.bind(this)));
	}

	/** 
	 * Retrieves the API key set by the user in the global RPGM Tools settings.
	 * @returns The API key string, or an empty string if not set.
	 */
	static get api_key() { return game.settings.get("rpgm-tools", "api_key") || ""; }

	/** 
	 * The initial asynchronous method called when the Foundry VTT `init` hook fires for this module.
	 * If `globalThis.rpgm` is not yet defined, it calls {@link initGlobal} to set up the global singleton.
	 * Registers this module instance with `rpgm.modules`.
	 * Calls the module's public {@link init} method for custom early initialization logic.
	 */
	private async _init() {
		if (!globalThis.rpgm)
			this.initGlobal();
		this.logger.styled("color: #ad8cef; font-weight: bold;").prefixed("").log(`${this.icon} ${this.name} joined the game`);
		rpgm.modules[this.id] = this;
		await this.init();
	}

	/** 
	 * The asynchronous method called when the Foundry VTT `setup` hook fires for this module.
	 * If this is the first RPGM module loaded, it registers global RPGM chat commands.
	 * Calls the module's public {@link registerSettings} method for module-specific settings, Radial Menus, and RP-Commands.
	 * Calls `GlobalMenus` to register shared menus relevant to the module.
	 */
	private async _setup() {
		if (this.first)
			registerRpgmCommands();
		await this.registerSettings();
		GlobalMenus(this.id);
	}

	/** 
	 * Initializes the global `rpgm` singleton object (`globalThis.rpgm`).
	 * This method is called only once by the very first RPGM module to be loaded.
	 * It sets up static properties like `RpgmModule.majorGameVersion`, `RpgmModule.logger`,
	 * `RpgmModule.radialMenu`, and `RpgmModule.chat`.
	 * Also registers a `renderSettingsConfig` hook to customize the appearance of module settings pages.
	 * Finally, calls `GlobalSettings` to register common RPGM settings.
	 */
	private initGlobal() {
		this.first = true;
		globalThis.rpgm = RpgmModule as typeof globalThis.rpgm;
		RpgmModule.majorGameVersion = game.data.release.generation;
		RpgmModule.logger = new RPGMLogger("🛠️ RPGM Tools | ");
		RpgmModule.radialMenu = new RadialMenuRegister();
		RpgmModule.chat = new ChatCommands();
		RpgmModule.logger.styled("color: #ad8cef; font-weight: bold;").prefixed("").log(`🛠️ RPGM Tools joined the game`);
		Hooks.on("renderSettingsConfig", (_, html) => {
			Object.keys(RpgmModule.modules).forEach(k => {
				const settingsHtml = rpgm.j(html);
				const screen = settingsHtml.querySelector(`[data-category="${k}"]`) as HTMLElement;
				// Move all menus to the bottom of the page
				screen?.querySelectorAll(`.form-group.submenu,.form-group:has([data-action="openSubmenu"])`).forEach(s => screen.appendChild(s));
				const copyright = document.createElement("div");
				copyright.style.fontStyle = "italic";
				copyright.style.textAlign = "center";
				copyright.innerText = "© 2025 RPGM Tools, LLC";
				screen.querySelectorAll("input,select").forEach(i => i.classList.add("rpgm-input"));
				screen.querySelectorAll("button").forEach(i => i.classList.add("rpgm-button"));
				screen?.appendChild(copyright);
			});
		});
		GlobalSettings();
		// initSidebar();
	}

	/**
	 * Lifecycle method for early module initialization. This method is called during the Foundry VTT `init` hook.
	 * Override this method in your module to perform any setup that needs to happen before settings are registered.
	 */
	init(): Promise<void> | void { }

	/**
	 * Lifecycle method for registering module-specific settings, Radial Menu buttons, and RP-Commands.
	 * This method is called during the Foundry VTT `setup` hook.
	 * Override this method in your module to define its configurations and custom interactions.
	 */
	registerSettings(): Promise<void> | void { }

	/**
	 * The protected asynchronous method called when the Foundry VTT `ready` hook fires for this module.
	 * If this is the first RPGM module loaded, it calls {@link RpgmModule.globalReady} for global finalization.
	 * Calls the module's public {@link rpgmReady} method for custom module-specific final initialization logic.
	 */
	protected async _ready() {
		if (this.first)
			RpgmModule.globalReady();
		await this.rpgmReady();
	}

	/**
	 * Lifecycle method called when Foundry VTT is fully loaded and ready.
	 * This method is invoked during the Foundry VTT `ready` hook.
	 * Override this method in your module to perform any actions that require the full game environment to be available.
	 */
	rpgmReady(): Promise<void> | void { }

	/**
	 * Unwraps a jQuery object to return the raw HTMLElement.
	 * This utility is crucial for compatibility with Foundry VTT v13+, which deprecates jQuery.
	 * @param el - The jQuery object or HTMLElement to unwrap.
	 * @returns The underlying HTMLElement.
	 */
	static j(el: JQuery<HTMLElement> | HTMLElement): HTMLElement {
		return el instanceof HTMLElement ? el : el[0];
	}

	/** 
	 * Static method called once when all Foundry VTT modules are loaded and the game is ready.
	 * This method performs final global setup tasks for RPGM Tools:
	 * - Updates the radial menu system.
	 * - Prunes chat commands.
	 * - Logs a stylized ASCII art banner to the console, listing all active RPGM modules and their versions.
	 */
	static globalReady() {
		rpgm.radialMenu.update();
		rpgm.chat.prune();

		const center = (s: string) => {
			return s.padStart(s.length + Math.floor((48 - s.length) / 2));
		};

		const splitJustify = (s: string) => {
			const [left, right] = s.split("%s");
			const spaces = Math.floor(48 - left.length);
			return `${left}${right.padStart(spaces)}`;
		};
		const asciiArt = (String.raw`
 ____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |/\| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
————————————————————————————————————————————————
${center(`© 2025 RPGM Tools, LLC`)}
${Object.values(rpgm.modules).map(m => splitJustify(` ${m.icon} ${m.name} %s v${m.version} `)).join('\n')}`).slice(1);

		rpgm.logger.styled("color: #d44e7b; font-weight: bold;").prefixed("").log(asciiArt);
	}
}
