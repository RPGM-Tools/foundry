import { type App, Component, createApp } from 'vue'

export abstract class RPGMSettingsMenu extends FormApplication {
	app!: App
	abstract type: Component

	constructor(object = {}, options = {}) {
		super(object, options)
	}

	protected override async _updateObject(): Promise<void> { }

	protected override async _renderInner(): Promise<JQuery> {
		const div = document.createElement("div")
		this.app = createApp(this.type)
		this.app.mount(div)

		if (div.firstElementChild)
			this.form = div.firstElementChild as HTMLElement
		return $(div)
	}

	static override get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "rpgm-secrets",
			height: "500px",
			width: "auto",
		})
	}

	override async close(options?: FormApplication.CloseOptions): Promise<void> {
		await super.close(options)
		this.app.unmount()
	}
}
