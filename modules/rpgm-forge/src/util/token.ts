import { ForgeNames } from "@rpgm/forge";
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
 * @param token - The token to rename, if omitted finds the current selected token
 * @param prompt - The prompt for what to generate, eg "Goblin", "Legendary Sword"
 */
export function chatTokenNames(token: Token | undefined, prompt?: string) {
	// User wants a token for the selected token
	if (!prompt) {
		token ??= getSelectedToken();
		if (token) {
			const protoToken = token.actor?.prototypeToken;
			rpgm.forge?.logger.debug(protoToken);
			if (!protoToken?.name) { rpgm.forge?.logger.errorU("Token has no name!"); return; }
			void rpgm.forge!.namesChats.newMessage({ tokenId: token.id, names: [], prompt: protoToken.name });
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
	const protoToken = tokenDocument.actor?.prototypeToken;
	if (!protoToken?.name) return { success: false, error: "Token has no name!" };

	/** @todo Less hardcoding of values */
	const options: NamesOptions = {
		quantity: 4,
		gender: "neutral",
		genre: rpgm.forge!.genre,
		method: rpgm.forge!.method,
		language: rpgm.forge!.language,
		type: type ?? protoToken.name
	};

	const token = canvas.tokens?.get(tokenDocument._id ?? "");
	let shimmerFilter;
	if (token) {
		shimmerFilter = await shimmerToken(token);
		void shimmerFilter.fadeIn(500);
	}

	const result = await rpgm.forge!.queue.generate(ForgeNames, options);

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
export async function quickNameToken(tokenDocument: TokenDocument) {
	const result = await generateTokenNames(tokenDocument);
	if (result.success)
		await nameToken(tokenDocument, result.output[0]);
}

/**
 * Updates a token with provided data
 * @param tokenDocument - The token document to update
 * @param name - The name to apply to the token
 */
export async function nameToken(tokenDocument: TokenDocument, name: string) {
	//@ts-expect-error Unsafe updating of tokenDocument
	await tokenDocument.update({ name }, {});
	if (game.settings.get("rpgm-forge", "rename_actors")) {
		//@ts-expect-error Unsafe updating of tokenDocument.actor
		await tokenDocument.actor?.update({ name }, {});
	}
}

let shift = false;

/** Setup the functionality for detecting when a token has been placed */
export function registerTokenCreate() {
	document.addEventListener("keydown", (k) => {
		if (k.key == "Shift") { shift = true; }
	});
	document.addEventListener("keyup", (k) => {
		if (k.key == "Shift") { shift = false; }
	});
	Hooks.on("createToken", async (tokenDocument: TokenDocument, options) => {
		if (options.parent !== canvas.scene) return;
		if (shift || !game.settings.get("rpgm-forge", "auto_name")) return;
		quickNameToken(tokenDocument);
	});
}
