import { ForgeNames } from '@rpgm/forge';
import { shimmerToken } from './shimmer';

/**
 * Find the one and only selected token
 * @returns The currently selected token, or undefined if more than one or none
 */
export function getSelectedToken(): Token | undefined {
	if (canvas.tokens!.controlled.length === 1) {
		return canvas.tokens!.controlled[0];
	} else {
		rpgm.forge!.logger.errorU(rpgm.localize("RPGM_FORGE.ERORRS.TOKEN_SELECT"));
		return undefined;
	}
}

/**
 * Creates a Description Wizard for the given prompt, or uses the selected token's name
 * @param prompt - Options for the description
 * @param prompt.type - The type of "thing" to generate a description for
 * @param prompt.name - The optional name to give the generator for use in the description
 */
export function chatDescription(prompt?: { type: string, name?: string }) {
	if (!prompt) {
		const token = getSelectedToken();
		if (!token) return;
		const actor = token.actor;
		if (!actor || !actor.name) return;
		void rpgm.forge!.descriptionsChats.newMessage({ name: "", tokenId: token.id, description: "", type: actor.name });
	} else {
		void rpgm.forge!.descriptionsChats.newMessage({ description: "", type: prompt.type, name: prompt.name });
	}
}

/**
 * Creates a Names Wizard for the given prompt, or uses the selected token's name
 * @param prompt - The prompt for what to generate, eg "Goblin", "Legendary Sword"
 */
export function chatTokenNames(prompt?: string) {
	// User wants a token for the selected token
	if (!prompt) {
		const token = getSelectedToken();
		if (token) {
			const actor = token.actor;
			if (!actor || !actor.name) return;
			void rpgm.forge!.namesChats.newMessage({ tokenId: token.id, names: [], prompt: actor.name });
		}
	}
	// User has a name for us to use
	else {
		void rpgm.forge!.namesChats.newMessage({ names: [], prompt });
	}
}

/**
 * Generates names for a token and applys a shimmer effect while generation is in progress
 * @param tokenDocument - The {@link TokenDocument} to rename
 * @param type - An optional type to pass to the renaming AI
 * @returns The names generated
 */
export async function generateTokenNames(tokenDocument: TokenDocument, type?: string): Promise<ForgeResponse<Names>> {
	const actor = tokenDocument.actor;
	if (!actor?.name) return { success: false, error: "Token has no name!" };

	/** @todo Less hardcoding of values */
	const options: NamesOptions = {
		quantity: 4,
		gender: "random",
		genre: "Fantasy",
		method: "ai",
		type: type ?? actor.name
	};

	const token = canvas.tokens?.get(tokenDocument._id ?? "");
	let shimmerFilter;
	if (token) {
		shimmerFilter = await shimmerToken(token);
		void shimmerFilter.fadeIn(500);
	}

	const result = await ForgeNames.fromOptions(options).generate({
		auth_token: game.settings.get("rpgm-tools", "api_key")
	});
	if (!result.success)
		rpgm.forge!.logger.errorU(result.error);

	if (shimmerFilter)
		void shimmerFilter.fadeOut(500);
	return result;
}

/**
 * Generates names and renames a token
 * @param tokenDocument - The token to rename
 */
export async function applyTokenName(tokenDocument: TokenDocument) {
	const result = await generateTokenNames(tokenDocument);
	if (result.success)
		//@ts-expect-error Unsafe updating of tokenDocument
		await tokenDocument.update({ name: result.output[0] }, {});
}

/** Setup the functionality for detecting when a token has been placed */
export function registerTokenCreate() {
	// Hooks.on("createToken", async (tokenDocument: TokenDocument) => renameToken(tokenDocument)
	// );
}
