import { ChatCommands } from './chat'
import { RadialMenuRegister } from './radial-menu'
import { GlobalSettings } from './settings'
import { RPGMLogger } from './util/logging'

export function initRpgm(source: string) {
	if (globalThis.rpgm) return
	GlobalSettings()

	globalThis.rpgm = {
		gameVersion: game.version,
		majorGameVersion: game.data.release.generation,
		logger: new RPGMLogger(),
		radialMenu: new RadialMenuRegister(),
		chatCommands: new ChatCommands(),
		settings: {}
	}
	readyRpgm()
	rpgm.logger.log(`This RPGM Tools experience was brought to you by: '${source}'`)
}

function readyRpgm() {
	Hooks.once("ready", () => {
		rpgm.radialMenu.update()
		rpgm.chatCommands.createChatPanel()
		rpgm.chatCommands.commands.push({
			name: "test1",
			callback: () => console.log("test1")
		})
		rpgm.chatCommands.commands.push({
			name: "test2",
			callback: () => console.log("test2")
		})
		rpgm.chatCommands.commands.push({
			name: "foo1",
			callback: () => console.log("foo1")
		})
		rpgm.chatCommands.commands.push({
			name: "bar1",
			callback: () => console.log("bar1")
		})
		rpgm.chatCommands.commands.push({
			name: "baz1",
			callback: () => console.log("baz1")
		})
		rpgm.chatCommands.commands.push({
			name: "test3",
			callback: () => console.log("test3")
		})
		rpgm.chatCommands.commands.push({
			name: "test4",
			callback: () => console.log("test4")
		})
		rpgm.chatCommands.commands.push({
			name: "foo2",
			callback: () => console.log("foo2")
		})
		rpgm.chatCommands.commands.push({
			name: "bar2",
			callback: () => console.log("bar2")
		})
		rpgm.chatCommands.commands.push({
			name: "baz2",
			callback: () => console.log("baz1")
		})
		rpgm.chatCommands.commands.push({
			name: "test5",
			callback: () => console.log("test5")
		})
		rpgm.chatCommands.commands.push({
			name: "test6",
			callback: () => console.log("test6")
		})
		rpgm.chatCommands.commands.push({
			name: "foo3",
			callback: () => console.log("foo3")
		})
		rpgm.chatCommands.commands.push({
			name: "bar3",
			callback: () => console.log("bar3")
		})
		rpgm.chatCommands.commands.push({
			name: "baz3",
			callback: () => console.log("baz3")
		})
		const asciiArt = String.raw`
________________________________________________
_____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |\/| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
________________________________________________`

		rpgm.logger.logF("color: #d44e7b; font-weight: bold;", asciiArt)
	})
}
