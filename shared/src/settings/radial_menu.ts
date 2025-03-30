import { RPGMSettingsMenu } from "./menu";
import RadialMenuForm from '../forms/RadialMenuForm.vue'

export class RadialMenuSettings extends RPGMSettingsMenu {
	override type = RadialMenuForm;
	override get title(): string {
		return "RPGM Tools - " + game.i18n.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS")
	}
}
