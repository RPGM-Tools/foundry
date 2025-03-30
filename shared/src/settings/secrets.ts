import { RPGMSettingsMenu } from "./menu";
import SecretsForm from '../forms/SecretsForm.vue'

export class SecretsSettings extends RPGMSettingsMenu {
	override type = SecretsForm;
	override get title(): string {
		return "RPGM Tools - " + game.i18n.localize("RPGM.CONFIG.SECRETS_SETTINGS")
	}
}
