import type { DeepPartial } from 'fvtt-types/utils';
import { type Component } from 'vue';

import DeveloperForm from '#/forms/DeveloperForm.vue';

import { RPGMSettingsMenu } from './index';
type DefaultOptions = DeepPartial<foundry.applications.api.ApplicationV2.Configuration>;

export class DeveloperSettings extends RPGMSettingsMenu {
	static icon: string = 'fas fa-flask';
	static override DEFAULT_OPTIONS: DefaultOptions = {
		id: 'rpgm-developer-settings',
		window: {
			icon: this.icon
		}
	};
	static override get name(): string { return rpgm.localize('RPGM_TOOLS.CONFIG.DEVELOPER_SETTINGS'); };
	static get hint(): string { return rpgm.localize('RPGM_TOOLS.CONFIG.DEVELOPER_SETTINGS_HINT'); };
	static get label(): string { return rpgm.localize('RPGM_TOOLS.CONFIG.DEVELOPER_SETTINGS_LABEL'); };
	static get subtitle(): string { return rpgm.localize('RPGM_TOOLS.CONFIG.DEVELOPER_SETTINGS_SUBTITLE'); };
	override component = DeveloperForm as Component;
	override get title(): string {
		return `RPGM Tools - ${rpgm.localize('RPGM_TOOLS.CONFIG.DEVELOPER_SETTINGS')}`;
	}
	static override registerMenu(id: string) {
		game.settings.registerMenu(id, this.DEFAULT_OPTIONS.id!, {
			name: DeveloperSettings.name,
			restricted: false,
			label: DeveloperSettings.label,
			hint: DeveloperSettings.hint,
			icon: this.icon,
			type: this
		});
	}
}
