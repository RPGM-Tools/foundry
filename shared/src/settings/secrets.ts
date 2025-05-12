/* eslint-disable jsdoc/require-jsdoc */
import { type Component } from "vue";
import { RPGMSettingsMenu } from "./index";
import SecretsForm from "#/forms/SecretsForm.vue";
import type { DeepPartial } from "fvtt-types/utils";
type DefaultOptions = DeepPartial<foundry.applications.api.ApplicationV2.Configuration>

export class SecretsSettings extends RPGMSettingsMenu {
	static override DEFAULT_OPTIONS: DefaultOptions = {
		id: "rpgm-secrets"
	};
	static override get name(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS"); };
	static get hint(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS_HINT"); };
	static get label(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS_LABEL"); };
	static get subtitle(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS_SUBTITLE"); };
	icon: string = "fas fa-key";
	override type = SecretsForm as Component;
	override get title(): string {
		return `RPGM Tools - ${rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS")}`;
	}
	static override registerMenu(id: string) {
		game.settings.registerMenu(id, this.DEFAULT_OPTIONS.id!, {
			name: SecretsSettings.name,
			label: SecretsSettings.label,
			hint: SecretsSettings.hint,
			icon: "fas fa-key",
			type: this
		});
	}
}
