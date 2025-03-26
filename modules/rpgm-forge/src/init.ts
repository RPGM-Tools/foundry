import * as logging from "#/util/logging"
import { RegisterSettings } from "./util/settings"
import { registerTokenCreate } from "./util/token"
import { initRpgm } from "#/init"
import { watchInputs } from '#/radial-menu'
import '#/style.css'

Hooks.once("init", () => {
	initRpgm("rpgm-forge")
	RegisterSettings()
	watchInputs()
	logging.log("Initialized RPGM Forge")
})
registerTokenCreate()

