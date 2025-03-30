import { RadialMenuRegister } from './radial-menu'
import { GlobalSettings } from './settings'
import * as logging from './util/logging'

export function initRpgm(source: string) {
	if (globalThis.rpgm) return
	GlobalSettings()

	globalThis.rpgm = {
		gameVersion: game.version,
		majorGameVersion: game.data.release.generation,
		radialMenu: new RadialMenuRegister(),
		settings: {}
	}
	readyRpgm()
	logging.log(`This RPGM Tools experience was brought to you by: '${source}'`)
}

function readyRpgm() {
	Hooks.once("ready", () => {
		const asciiArt = String.raw`
________________________________________________
_____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |\/| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
________________________________________________`

		logging.logF("color: #d44e7b; font-weight: bold;", asciiArt)
	})
}
