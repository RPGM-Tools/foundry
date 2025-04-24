import { ChatCommands } from './chat';
import { hudHeuristics, inputHeuristics, RadialMenuRegister } from './radial-menu';
import { GlobalSettings } from './settings';
import { RPGMLogger } from './util/logging';
import { localize } from './util/localize';

export function initRpgm(source: string) {
	if (globalThis.rpgm) return;
	globalThis.rpgm = {
		gameVersion: game.version,
		majorGameVersion: game.data.release.generation,
		logger: new RPGMLogger(),
		radialMenu: new RadialMenuRegister(),
		chatCommands: new ChatCommands(),
		localize,
	};
	rpgm.logger.log(`This RPGM Tools experience was brought to you by: '${source}'`);
	GlobalSettings();
	i18nInit();
	readyRpgm();
}

function i18nInit() {
	Hooks.once("i18nInit", () => {
		Hooks.call("rpgm-init");
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
	});
}

function readyRpgm() {
	Hooks.once("ready", () => {
		rpgm.radialMenu.update();
		rpgm.chatCommands.createChatPanel();
		rpgm.chatCommands.commands.push({
			name: "test1",
			callback: () => rpgm.logger.log("test1")
		});
		rpgm.chatCommands.commands.push({
			name: "test2",
			callback: () => rpgm.logger.log("test2")
		});
		rpgm.chatCommands.commands.push({
			name: "foo1",
			callback: () => rpgm.logger.log("foo1")
		});
		rpgm.chatCommands.commands.push({
			name: "bar1",
			callback: () => rpgm.logger.log("bar1")
		});
		rpgm.chatCommands.commands.push({
			name: "baz1",
			callback: () => rpgm.logger.log("baz1")
		});
		rpgm.chatCommands.commands.push({
			name: "test3",
			callback: () => rpgm.logger.log("test3")
		});
		rpgm.chatCommands.commands.push({
			name: "test4",
			callback: () => rpgm.logger.log("test4")
		});
		rpgm.chatCommands.commands.push({
			name: "foo2",
			callback: () => rpgm.logger.log("foo2")
		});
		rpgm.chatCommands.commands.push({
			name: "bar2",
			callback: () => rpgm.logger.log("bar2")
		});
		rpgm.chatCommands.commands.push({
			name: "baz2",
			callback: () => rpgm.logger.log("baz1")
		});
		rpgm.chatCommands.commands.push({
			name: "test5",
			callback: () => rpgm.logger.log("test5")
		});
		rpgm.chatCommands.commands.push({
			name: "test6",
			callback: () => rpgm.logger.log("test6")
		});
		rpgm.chatCommands.commands.push({
			name: "foo3",
			callback: () => rpgm.logger.log("foo3")
		});
		rpgm.chatCommands.commands.push({
			name: "bar3",
			callback: () => rpgm.logger.log("bar3")
		});
		rpgm.chatCommands.commands.push({
			name: "baz3",
			callback: () => rpgm.logger.log("baz3")
		});
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
