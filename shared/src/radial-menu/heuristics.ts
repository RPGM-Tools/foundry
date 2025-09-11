/**
 * Heuristics for buttons using the hud radial menu.
 * @param context - The context for this button
 * @returns A builder for the heuristics
 */
export function hudHeuristics(context: TokenHudContext) {
	let flag = false;
	const chatAllowed = false;

	/** Default options that can be overridden. */
	function defaults() {
		// Prevent attaching to any input which contains "search"
		flag ||= context.element?.outerHTML.toLowerCase().includes('search') ?? false;
		// Don't attach to chat interface by default
		if (!chatAllowed)
			flag ||= context.element?.id === 'chat-message';
	}

	const api = {
		/** @returns The result of the heuristics */
		get result() {
			defaults();
			return !flag;
		},

		/** @returns Is rpgm-tools.radial_menu_debug enabled? */
		isDebug() {
			flag ||= !game.settings.get('rpgm-tools', 'radial_menu_debug');
			return api;
		},

		/** @returns Is the user the gamemaster? */
		isGM() {
			flag ||= !game.user.isGM;
			return api;
		}
	};

	return api;
}

/**
 * Heuristics for buttons using the input radial menu.
 * @param context - The context for this button
 * @returns A builder for the heuristics
 */
export function inputHeuristics(context: InputContext) {
	let flag = false;
	let chatAllowed = false;

	/** Default options that can be overridden. */
	function defaults() {
		// Prevent attaching to any input which contains "search"
		flag ||= context.element?.outerHTML.toLowerCase().includes('search') ?? false;
		// Don't attach to chat interface by default
		if (!chatAllowed)
			flag ||= context.element?.id === 'chat-message';
	}

	const api = {
		/** @returns The result of the heuristics */
		get result() {
			defaults();
			return !flag;
		},

		/** @returns Only inputs with text content are allowed */
		noNumber() {
			flag ||= /^\d+$/.test(context.getValue());
			return api;
		},

		/** @returns Is rpgm-tools.radial_menu_debug enabled? */
		isDebug() {
			flag ||= !game.settings.get('rpgm-tools', 'radial_menu_debug');
			return api;
		},

		/** @returns Is the user the gamemaster? */
		isGM() {
			flag ||= !game.user.isGM;
			return api;
		},

		/** @returns Attach button to the main chat interface */
		isChat() {
			chatAllowed = true;
			flag ||= context.element?.id !== 'chat-message';
			return api;
		}
	};

	return api;
}

