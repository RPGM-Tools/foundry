import * as logging from "#/util/logging"
import { RegisterSettings } from "./util/settings"
import { initRpgm } from "#/init"
import '#/style.css'
import { contextHeuristics } from '#/radial-menu'

Hooks.once("init", () => {
	initRpgm("rpgm-vault")
	RegisterSettings()
	registerRadialMenu()
	logging.log("Initialized RPGM Vault")
})

function registerRadialMenu() {
	rpgm.radialMenu.registerCategory("rpgm-vault", { color: "240deg" })
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-vault',
		icon: 'fa fa-file-export',
		tooltip: "",
		detective: (context) => contextHeuristics(context).noNumber().value,
		callback: async () => {
			logging.logU("Saving this value...")
		}
	})
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-vault',
		icon: 'fa fa-crosshairs-simple',
		tooltip: "",
		detective: (context) => contextHeuristics(context).noNumber().value,
		callback: async () => logging.logU("Analyzing this value...")
	})
}
