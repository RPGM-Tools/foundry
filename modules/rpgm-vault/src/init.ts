import * as logging from "#/util/logging"
import { RegisterSettings } from "./util/settings"
import { initRpgm } from "#/init"
import '#/style.css'

Hooks.once("init", () => {
	initRpgm("rpgm-vault")
	RegisterSettings()
	logging.log("Initialized RPGM Vault")
})
