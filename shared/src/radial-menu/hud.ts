import type { Reactive, Component } from 'vue';
import RadialMenuFloating from './RadialMenuFloating.vue';

/** Injects code to render the dice hud */
export function injectTokenHUD() {
	const func = TokenHUD.prototype["_replaceHTML"];
	TokenHUD.prototype._replaceHTML = function(element: JQuery, html: JQuery) {
		func.call(this, element, html);
		renderTokenHUD.call(this, element, html);
	};
}

/**
 * Renders a Radial Menu on the Token HUD
 * @param _element - (unused)
 * @param html - The token hud element to modify
 */
function renderTokenHUD(this: TokenHUD, _element: JQuery, html: JQuery | HTMLElement) {
	if (game.settings.get("rpgm-tools", "radial_menu_hud") !== true) return;
	/**
	 * Workaround for differences between Foundry 12 and 13 
	 * {@link html} is of type JQuery in 12, HTMLElement in 13
	 */
	const htmlElement = rpgm.j(html);
	this.menuApp?.unmount();
	const appContainer = document.createElement('div');
	appContainer.style.position = 'absolute';
	appContainer.style.width = '100%';
	appContainer.style.height = '100%';
	appContainer.style.zIndex = '99';
	htmlElement.appendChild(appContainer);
	this.menuApp = createApp(RadialMenuFloating as Component);
	this.menuApp.provide<HTMLElement>('element', htmlElement);
	this.menuApp.provide<RadialButton<TokenHudContext>[]>('buttons', rpgm.radialMenu.tokenHudButtons);
	this.menuApp.provide<Reactive<TokenHudContext>>('context', shallowReactive({
		loading: false,
		shift: false,
		element: htmlElement,
		token: this.object
	}));
	this.menuApp.mount(appContainer);

}
