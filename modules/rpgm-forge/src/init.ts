import * as logging from "#/util/logging"
import { RegisterSettings } from "./settings"
import { generateTokenNames, registerTokenCreate } from "./util/token"
import { initRpgm } from "#/init"
import '#/style.css'
import { contextHeuristics, writeOn } from "#/radial-menu"

Hooks.once("init", () => {
	initRpgm("rpgm-forge")
	RegisterSettings()
	registerRadialMenu()
	logging.log("Initialized RPGM Forge")
})
registerTokenCreate()

function registerRadialMenu() {
	rpgm.radialMenu.registerCategory("rpgm-forge", { color: "276deg" })
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-forge',
		icon: 'fa fa-dice-d4',
		tooltip: "RPGM.RADIAL_MENU.D4",
		detective: (context) => contextHeuristics(context).noNumber().value,
		callback: (context) => writeOn(context, `Rolled a ${Math.floor(Math.random() * 4) + 1}`, 250)
	})
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-forge',
		icon: 'fa fa-dice-d6',
		tooltip: "RPGM.RADIAL_MENU.D6",
		detective: (context) => contextHeuristics(context).noNumber().value,
		callback: (context) => writeOn(context, `Rolled a ${Math.floor(Math.random() * 6) + 1}`, 250)
	})
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-forge',
		icon: 'fa fa-comment',
		tooltip: "",
		detective: (context) => contextHeuristics(context).isChat().noNumber().value,
		callback: (context) => writeOn(context, "Hello, World! Here is some lorem ipsum for you to consider.", 500)
	})
	rpgm.radialMenu.registerTokenHudButton({
		category: 'rpgm-forge',
		icon: 'fa fa-input-text',
		tooltip: "RPGM.RADIAL_MENU.NAMES",
		detective: () => true,
		callback: (context) => generateTokenNames(context.token.document)
	})
}
