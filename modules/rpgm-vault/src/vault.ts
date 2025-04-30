import { RpgmModule } from "#/module";
import { inputHeuristics } from "#/radial-menu";
import { RPGMLogger } from "#/util/logging";

export class RpgmVault extends RpgmModule {
	override id: string = "rpgm-vault";
	override name: string = "RPGM Vault";
	override readonly logger = new RPGMLogger("🗃️ RPGM Vault");

	override init(): Promise<void> | void { }

	override registerSettings(): Promise<void> | void {
		rpgm.radialMenu.registerCategory("rpgm_vault", { color: "240deg" });
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_vault,
			icon: 'fa fa-file-export',
			tooltip: "RPGM_VAULT.RADIAL_MENU.SAVE",
			detective: (context) => inputHeuristics(context).noNumber().result,
			callback: () => {
				rpgm.logger.logU("Saving this value...");
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_vault,
			icon: 'fa fa-crosshairs-simple',
			tooltip: "RPGM_VAULT.RADIAL_MENU.ANALYZE",
			detective: (context) => inputHeuristics(context).noNumber().result,
			callback: () => rpgm.logger.logU("Analyzing this value...")
		});
	}

	override i18nInit(): Promise<void> | void { }

	override rpgmReady(): Promise<void> | void { }
}
