import * as logging from "#/util/logging"
import { RegisterSettings } from "./settings"
import { generateTokenNames, registerTokenCreate } from "./util/token"
import { initRpgm } from "#/init"
import '#/style.css'
import { contextHeuristics, shimmerInput, writeOn } from "#/radial-menu"
import { shimmerToken } from "./util/shimmer"

Hooks.once("init", () => {
	initRpgm("rpgm-forge")
	RegisterSettings()
	registerRadialMenu()
	logging.log("Initialized RPGM Forge")
})
registerTokenCreate()

function registerRadialMenu() {
	rpgm.radialMenu.registerCategory("rpgm-forge", { color: "276deg" })
	rpgm.radialMenu.registerTokenHudButton({
		category: 'rpgm-forge',
		icon: 'fa-regular fa-circle-info',
		tooltip: "",
		detective: () => true,
		callback: async (context) => logging.log(context.token.actor)
	})
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-forge',
		icon: 'fa fa-dice-d4',
		tooltip: "RPGM.RADIAL_MENU.D4",
		detective: (context) => contextHeuristics(context).noNumber().value,
		callback: async (context) => {
			const effect = shimmerInput(context)
			await writeOn(context, `Rolled a ${Math.floor(Math.random() * 4) + 1}`, 250)
			effect()
		}
	})
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-forge',
		icon: 'fa fa-dice-d6',
		tooltip: "RPGM.RADIAL_MENU.D6",
		detective: (context) => contextHeuristics(context).noNumber().value,
		callback: async (context) => {
			const effect = shimmerInput(context)
			await writeOn(context, `Rolled a ${Math.floor(Math.random() * 6) + 1}`, 250)
			effect()
		}
	})
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-forge',
		icon: 'fa fa-comment',
		tooltip: "RPGM.RADIAL_MENU.LOREM_IPSUM",
		detective: (context) => contextHeuristics(context).isChat().noNumber().value,
		callback: async (context) => {
			const effect = shimmerInput(context)
			await writeOn(context, "Hello, World! Here is some lorem ipsum for you to consider.", 500)
			effect()
		}
	})
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-forge',
		icon: 'fa fa-sparkles',
		tooltip: "RPGM.RADIAL_MENU.START_SHIMMER",
		detective: (context) => contextHeuristics(context).isGM().isChat().noNumber().value,
		callback: async (context) => {
			context.element.classList.add("rpgm-active")
		}
	})
	rpgm.radialMenu.registerInputButton({
		category: 'rpgm-forge',
		icon: 'fa-regular fa-sparkle',
		tooltip: "RPGM.RADIAL_MENU.STOP_SHIMMER",
		detective: (context) => contextHeuristics(context).isGM().isChat().noNumber().value,
		callback: async (context) => {
			context.element.classList.remove("rpgm-active")
		}
	})
	rpgm.radialMenu.registerTokenHudButton({
		category: 'rpgm-forge',
		icon: 'fa fa-input-text',
		tooltip: "RPGM.RADIAL_MENU.NAMES",
		detective: () => true,
		callback: (context) => generateTokenNames(context.token.document)
	})
	rpgm.radialMenu.registerTokenHudButton({
		category: 'rpgm-forge',
		icon: 'fa fa-sparkles',
		tooltip: "RPGM.RADIAL_MENU.START_SHIMMER",
		detective: () => true,
		callback: async (context) => {
			const filter = shimmerToken(context.token)
			return filter.fadeIn(500)
		}
	})
	rpgm.radialMenu.registerTokenHudButton({
		category: 'rpgm-forge',
		icon: 'fa-regular fa-sparkle',
		tooltip: "RPGM.RADIAL_MENU.STOP_SHIMMER",
		detective: () => true,
		callback: async (context) => {
			const filter = shimmerToken(context.token)
			return filter.fadeOut(500)
		}
	})
}
