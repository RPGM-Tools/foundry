import * as logging from '@/util/logging'
import { createApp, type App } from 'vue'
import Secrets from '@/forms/Secrets.vue'

export function RegisterSettings() {
	game.settings.registerMenu("rpgm-tools", "secrets", {
		name: game.i18n.localize("RPGM.CONFIG.SECRETS_MENU"),
		hint: game.i18n.localize("RPGM.CONFIG.SECRETS_MENU_HINT"),
		label: game.i18n.localize("RPGM.CONFIG.SECRETS_MENU"),
		icon: "fas fa-key",
		type: SecretsMenu,
		restricted: true,
	})

	game.settings.register("rpgm-tools", "api_key", {
		name: game.i18n.localize("RPGM.CONFIG.API_KEY"),
		hint: game.i18n.localize("RPGM.CONFIG.API_KEY_HINT"),
		type: String,
	})
	logging.log("Registered RPGM-Tools settings")
}

class SecretsMenu extends FormApplication {
	app!: App

	constructor(object = {}, options = {}) {
		super(object, options)
	}

	protected override async _updateObject(): Promise<void> { }

	protected override async _renderInner(): Promise<JQuery> {
		const div = document.createElement("div")
		this.app = createApp(Secrets)
		this.app.mount(div)

		if (div.firstElementChild)
			this.form = div.firstElementChild as HTMLElement
		return $(div)
	}

	static override get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "rpgm-secrets",
			title: "RPGM Tools - " + game.i18n.localize("RPGM.CONFIG.SECRETS_MENU"),
			height: "500px",
			width: "auto",
		})
	}

	override async close(options?: FormApplication.CloseOptions): Promise<void> {
		await super.close(options)
		this.app.unmount()
	}
}
