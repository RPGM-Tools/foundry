import type { Component, ShallowReactive } from 'vue';

import { j } from '#/util/compatibility';

import RadialMenuFloating from './RadialMenuFloating.vue';

/** Injects code to render the dice hud. */
export function injectTokenHUD() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Hooks.on('renderTokenHUD', renderTokenHUD as any);
}

/**
 * Renders a Radial Menu on the Token HUD.
 * @param _element - (unused)
 * @param html - The token hud element to modify
 */
function renderTokenHUD(_element: JQuery, html: JQuery | HTMLElement) {
	if (game.settings.get('rpgm-tools', 'radial_menu_hud') !== true) return;

	/**
	 * Workaround for differences between Foundry 12 and 13 
	 * {@link html} is of type JQuery in 12, HTMLElement in 13
	 */
	const hud = game.canvas.tokens!.hud;
	const htmlElement = j(html);
	hud.menuApp?.unmount();
	const appContainer = document.createElement('div');
	appContainer.style.position = 'absolute';
	appContainer.style.width = '100%';
	appContainer.style.height = '100%';
	appContainer.style.zIndex = '99';
	htmlElement.appendChild(appContainer);
	hud.menuApp = createApp(RadialMenuFloating as Component);
	hud.menuApp.provide<HTMLElement>('element', htmlElement);
	hud.menuApp.provide<RadialButton<TokenHudContext>[]>('buttons', rpgm.radialMenu.tokenHudButtons);
	hud.menuApp.provide<ShallowReactive<TokenHudContext>>('context', shallowReactive({
		loading: false,
		shift: false,
		element: htmlElement,
		token: hud.object
	}));
	hud.menuApp.mount(appContainer);
}
