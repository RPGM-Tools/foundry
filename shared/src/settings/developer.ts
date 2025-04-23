import { RPGMSettingsMenu } from "./menu";
import DeveloperForm from "../forms/DeveloperForm.vue";

export class DeveloperSettings extends RPGMSettingsMenu {
	override type = DeveloperForm
	override get title(): string {
		return "RPGM Tools - " + rpgm.localize("RPGM.CONFIG.DEVELOPER_SETTINGS")
	}
	override get id(): string { return "rpgm-developer" }
}
