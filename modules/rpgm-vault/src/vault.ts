import { RpgmModule } from "#/module";
import { inputHeuristics } from "#/radial-menu";
import { RPGMLogger } from "#/util/logging";

/**
 * @todo Store generated lore objects
 */
export class RpgmVault extends RpgmModule {
	override readonly id: ClientSettings.Namespace = "rpgm-vault";
	override readonly name: string = "RPGM Vault";
	override readonly icon: string = "🗃️";
	override readonly logger = new RPGMLogger(`${this.icon} ${this.name}`);

	/**
	 * Register module-specific settings here
	 * Also where Radial Menu buttons and RP-Commands are registered (might change)
	 */
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
}
