import axios from "axios";
import type { DeepPartial } from "fvtt-types/utils";
import { err, ok } from "neverthrow";
import { type Component } from "vue";

import SecretsForm from "#/forms/SecretsForm.vue";

import { RPGMSettingsMenu } from "./index";
type DefaultOptions = DeepPartial<foundry.applications.api.ApplicationV2.Configuration>

export class SecretsSettings extends RPGMSettingsMenu {
	static icon: string = "fas fa-key";
	static override DEFAULT_OPTIONS: DefaultOptions = {
		id: "rpgm-secrets",
		window: {
			icon: this.icon,
			resizable: true,
		}
	};
	static override get name(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS"); };
	static get hint(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS_HINT"); };
	static get label(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS_LABEL"); };
	static get subtitle(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS_SUBTITLE"); };
	override component = SecretsForm as Component;
	override get title(): string {
		return `RPGM Tools - ${rpgm.localize("RPGM_TOOLS.CONFIG.SECRETS_SETTINGS")}`;
	}
	static override registerMenu(id: string) {
		game.settings.registerMenu(id, this.DEFAULT_OPTIONS.id!, {
			name: SecretsSettings.name,
			restricted: false,
			label: SecretsSettings.label,
			hint: SecretsSettings.hint,
			icon: this.icon,
			type: this
		});
	}
}

export async function useUser() {
	const res = await axios.get("https://api.rpgm.tools/user", {
		headers: { Authorization: rpgm.loginToken }
	}).then(res => ok(res.data as object))
		.catch(() => err());
	return res.unwrapOr(undefined);
}

