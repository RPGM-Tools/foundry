import { RPGMSettingsMenu } from "./menu";
import DeveloperForm from "../forms/DeveloperForm.vue";

export class DeveloperSettings extends RPGMSettingsMenu {
	override type = DeveloperForm
	override get title(): string {
		return "RPGM Tools - " + game.i18n.localize("RPGM.CONFIG.DEVELOPER_SETTINGS")
	}
}
