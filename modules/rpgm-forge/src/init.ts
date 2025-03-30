import * as logging from "#/util/logging"
import { RegisterSettings } from "./settings"
import { registerTokenCreate } from "./util/token"
import { initRpgm } from "#/init"
import '#/style.css'

Hooks.once("init", () => {
	initRpgm("rpgm-forge")
	RegisterSettings()
	registerRadialMenu()
	logging.log("Initialized RPGM Forge")
})
registerTokenCreate()

function registerRadialMenu() {
	rpgm.radialMenu.registerCategory("rpgm-forge", { color: "276deg" })
	rpgm.radialMenu.registerButton({
		category: 'rpgm-forge',
		icon: 'fa fa-dice-d4',
		tooltip: "RPGM.RADIAL_MENU.D4",
		detective: () => true,
		callback: () => logging.logU("Rolled a", Math.floor(Math.random() * 4) + 1)
	})
	rpgm.radialMenu.registerButton({
		category: 'rpgm-forge',
		icon: 'fa fa-dice-d6',
		tooltip: "RPGM.RADIAL_MENU.D6",
		detective: () => true,
		callback: () => logging.logU("Rolled a", Math.floor(Math.random() * 6) + 1)
	})
}
