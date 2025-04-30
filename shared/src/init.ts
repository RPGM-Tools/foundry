import { ChatCommands } from './chat';
import { hudHeuristics, inputHeuristics, RadialMenuRegister } from './radial-menu';
import { GlobalSettings } from './settings';
import { RPGMLogger } from './util/logging';
import { localize } from './util/localize';
import { literal, argument, string } from 'brigadier-ts-lite';

export function initRpgm(source: string) {
	if (globalThis.rpgm) return;
	globalThis.rpgm = {
		gameVersion: game.version,
		majorGameVersion: game.data.release.generation,
		logger: new RPGMLogger(),
		radialMenu: new RadialMenuRegister(),
		chat: new ChatCommands(),
		modules: {},
		localize,
	};
	rpgm.logger.log(`This RPGM Tools experience was brought to you by: '${source}'`);
	GlobalSettings();
	i18nInit();
	readyRpgm();
}
function i18nInit() {
	Hooks.once("i18nInit", () => {
		rpgm.chat.registerCommand(literal("say").then(argument("words", string("greedy_phrase")).executes(c => rpgm.logger.logU(c.get<string>("words")))));
		rpgm.radialMenu.registerCategory("rpgm_debug", { color: '60deg' });
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_debug,
			icon: 'fa-regular fa-circle-info',
			tooltip: "RPGM_TOOLS.RADIAL_MENU.INFO",
			detective: (context) => hudHeuristics(context).isGM().isDebug().result,
			callback: (context) => rpgm.logger.log(context.token?.actor)
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_debug,
			icon: 'fa fa-terminal',
			tooltip: "RPGM_TOOLS.RADIAL_MENU.COMMAND",
			detective: (context) => inputHeuristics(context).isChat().isGM().isDebug().result,
			callback: (context) => {
				context.element.focus();
				context.setValue('*');
				context.element.dispatchEvent(new KeyboardEvent("keyup", { key: "*" }));
			}
		});
		Hooks.call("rpgm-init");
	});
}

function readyRpgm() {
	Hooks.once("ready", () => {
		rpgm.radialMenu.update();
		const asciiArt = String.raw`
________________________________________________
_____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |\/| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
________________________________________________`;

		rpgm.logger.logF("color: #d44e7b; font-weight: bold;", asciiArt);
	});
}
