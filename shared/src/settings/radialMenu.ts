import { type Component } from "vue";
import { RPGMSettingsMenu } from "./index";
import RadialMenuForm from "#/forms/RadialMenuForm.vue";
import type { DeepPartial } from "fvtt-types/utils";
type DefaultOptions = DeepPartial<foundry.applications.api.ApplicationV2.Configuration>

export class RadialMenuSettings extends RPGMSettingsMenu {
	static override DEFAULT_OPTIONS: DefaultOptions = {
		id: "rpgm-radial-menu"
	};
	static override get name(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_SETTINGS"); };
	static get hint(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_SETTINGS_HINT"); };
	static get label(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_SETTINGS_LABEL"); };
	static get subtitle(): string { return rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_SETTINGS_SUBTITLE"); };
	icon: string = "fas fa-dice-d20";
	override type = RadialMenuForm as Component;
	override get title(): string {
	    return `RPGM Tools - ${rpgm.localize("RPGM_TOOLS.CONFIG.RADIAL_MENU_SETTINGS")}`;
	}
	static override registerMenu(id: string) {
		game.settings.registerMenu(id, this.DEFAULT_OPTIONS.id!, {
			name: RadialMenuSettings.name,
			label: RadialMenuSettings.label,
			hint: RadialMenuSettings.hint,
			icon: "fas fa-dice-d20",
			type: this
		});
	}
}
