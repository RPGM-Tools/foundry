import { RegisterSettings } from "./util/settings"
import { initRpgm } from "#/init"
import '#/style.css'
import { inputHeuristics } from '#/radial-menu'

Hooks.once("init", () => {
	initRpgm("rpgm-vault")
	RegisterSettings()
	registerRadialMenu()
	rpgm.logger.log("Initialized RPGM Vault")
})

function registerRadialMenu() {
	rpgm.radialMenu.registerCategory("rpgm_vault", { color: "240deg" })
	rpgm.radialMenu.registerInputButton({
		category: rpgm.radialMenu.categories.rpgm_vault,
		icon: 'fa fa-file-export',
		tooltip: "",
		detective: (context) => inputHeuristics(context).noNumber().result,
		callback: async () => {
			rpgm.logger.logU("Saving this value...")
		}
	})
	rpgm.radialMenu.registerInputButton({
		category: rpgm.radialMenu.categories.rpgm_vault,
		icon: 'fa fa-crosshairs-simple',
		tooltip: "",
		detective: (context) => inputHeuristics(context).noNumber().result,
		callback: async () => rpgm.logger.logU("Analyzing this value...")
	})
}
