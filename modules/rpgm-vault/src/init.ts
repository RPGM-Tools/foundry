// import { RegisterSettings } from "./settings";
// import { initRpgm } from "#/init";
// import { inputHeuristics } from '#/radial-menu';
import '#/style.css';
import { RpgmVault } from "./vault";

new RpgmVault();

// Hooks.once("init", () => {
// 	initRpgm("rpgm-vault");
// });
//
// Hooks.once("rpgm-init", () => {
// 	RegisterSettings();
// 	registerRadialMenu();
// 	rpgm.logger.log("Initialized RPGM Vault");
// });
//
// function registerRadialMenu() {
// 	rpgm.radialMenu.registerCategory("rpgm_vault", { color: "240deg" });
// 	rpgm.radialMenu.registerInputButton({
// 		category: rpgm.radialMenu.categories.rpgm_vault,
// 		icon: 'fa fa-file-export',
// 		tooltip: "RPGM_VAULT.RADIAL_MENU.SAVE",
// 		detective: (context) => inputHeuristics(context).noNumber().result,
// 		callback: () => {
// 			rpgm.logger.logU("Saving this value...");
// 		}
// 	});
// 	rpgm.radialMenu.registerInputButton({
// 		category: rpgm.radialMenu.categories.rpgm_vault,
// 		icon: 'fa fa-crosshairs-simple',
// 		tooltip: "RPGM_VAULT.RADIAL_MENU.ANALYZE",
// 		detective: (context) => inputHeuristics(context).noNumber().result,
// 		callback: () => rpgm.logger.logU("Analyzing this value...")
// 	});
// }
