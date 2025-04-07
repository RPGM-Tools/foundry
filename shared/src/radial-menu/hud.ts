import { type App, createApp } from 'vue'
import RadialMenu from './RadialMenu.vue'

export class RPGMTokenHUD<Options extends Application.Options> extends TokenHUD<Options> {
	menuApp: App | null = null

	protected override _replaceHTML(element: JQuery, html: JQuery): void {
		super._replaceHTML(element, html)
		if (game.settings.get("rpgm-tools", "radial_menu_enabled") !== "true") return
		/** Workaround for differences between Foundry 12 and 13 
		 * {@link html} is of type JQuery in 12, HTMLElement in 13
		 */
		const htmlElement = html instanceof HTMLElement ? html : html[0]
		this.menuApp?.unmount()
		const appContainer = document.createElement('div')
		appContainer.style.position = 'absolute'
		appContainer.style.width = '100%'
		appContainer.style.height = '100%'
		appContainer.style.zIndex = '99'
		htmlElement.appendChild(appContainer)
		this.menuApp = createApp(RadialMenu)
		this.menuApp.provide<HTMLElement>('element', htmlElement)
		this.menuApp.provide<RadialButton<TokenHudContext>[]>('items', rpgm.radialMenu.tokenHudButtons)
		this.menuApp.provide<TokenHudContext>('context', {
			loading: false,
			token: this.object as Token
		})
		this.menuApp.mount(appContainer)
	}
}
