import * as logging from "#/util/logging"
import { RegisterSettings } from "./util/settings"
import { initRpgm } from "#/init"
import '#/style.css'

Hooks.once("init", () => {
	initRpgm("rpgm-vault")
	RegisterSettings()
	registerRadialMenu()
	logging.log("Initialized RPGM Vault")
})

function registerRadialMenu() {
	rpgm.radialMenu.registerCategory("rpgm-vault", { color: "240deg" })
	rpgm.radialMenu.registerButton({
		category: 'rpgm-vault',
		icon: 'fa fa-file-export',
		tooltip: "",
		detective: () => true,
		callback: () => logging.logU("Saving this value...")
	})
	rpgm.radialMenu.registerButton({
		category: 'rpgm-vault',
		icon: 'fa fa-crosshairs-simple',
		tooltip: "",
		detective: () => true,
		callback: () => logging.logU("Analyzing this value...")
	})
}
