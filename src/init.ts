import * as logging from "@/util/logging"
import { RegisterSettings } from "@/util/settings"
import { registerTokenCreate } from "@/util/token"
import '@/style.css'
// import { MuseNames, MuseObject, NamesOptions } from '@rpgm/muse'

Hooks.once("init", async () => {
	// Ensure the bare RPGM namespace exists on game and globally.
	globalThis.RPGM ||= {
		version: import.meta.env.RPGM_VERSION,
		debug: import.meta.env.DEV,
		gameVersion: game.version,
		majorGameVersion: game.data.release.generation,
		config: {
			maxMessageHistory: 20,
			minMessageInterval: 5000,
			maxUIMessageLength: 100,
			usePersistentLogs: false,
		},
		defaults: {
			worldName: `${game.world.title} (Foundry)`,
			language: "",
			genre: "",
			artStyle: "",
			aiModel: "",
			nameFormat: "",
			descVerbosity: ""
		}
	}

	if (!globalThis.RPGM.debug)
		logging.log("RPGM Tools is loading...")
	else
		logging.debug("RPGM Tools is loading in debug mode...")

	RegisterSettings()
})

Hooks.once("ready", async () => {
	const asciiArt = String.raw`RPGM.tools v${globalThis.RPGM.version}
________________________________________________
 ____  ____   ____ __  __  _              _     
|  _ \|  _ \ / ___|  \/  || |_ ___   ___ | |___ 
| |_) | |_) | |  _| |\/| || __/ _ \ / _ \| / __|
|  _ <|  __/| |_| | |  | || || (_) | (_) | \__ \
|_| \_\_|    \____|_|  |_(_)__\___/ \___/|_|___/
________________________________________________`

	logging.logF("color: #d44e7b; font-weight: bold;", asciiArt)
	logging.log(game.i18n.localize("RPGM.LOGGING.READY"))
	logging.log("This is your current world: " + RPGM.defaults.worldName)

	// const options = new NamesOptions({ quantity: 5, method: "ai", type: "Goblin", genre: "Fantasy", gender: "Random" })
	// const result = await MuseNames.fromOptions(options).generate()
	// if (result instanceof MuseObject) {
	// 	logging.log(result.output)
	// } else {
	// 	logging.error(result)
	// }
})

registerTokenCreate()
