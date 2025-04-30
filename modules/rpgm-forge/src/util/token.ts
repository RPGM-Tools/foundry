import { ForgeNames } from '@rpgm/forge';
import { shimmerToken } from './shimmer';

export function getSelectedToken(): Token | undefined {
	if (canvas.tokens!.controlled.length === 1) {
		return canvas.tokens!.controlled[0];
	} else {
		rpgm.forge!.logger.errorU(rpgm.localize("RPGM_FORGE.ERORRS.TOKEN_SELECT"));
	}
}

export async function chatDescription(prompt?: { type: string, name?: string }) {
	if (!prompt) {
		const token = getSelectedToken();
		if (!token) return;
		const actor = token.actor;
		if (!actor || !actor.name) return;
		const id = await rpgm.chat.createMessage("rpgm-forge", "description");
		rpgm.forge!.setDescription(id, { name: "", tokenId: token.id, description: "", type: actor.name });
	} else {
		const id = await rpgm.chat.createMessage("rpgm-forge", "description");
		rpgm.forge!.setDescription(id, { description: "", type: prompt.type, name: prompt.name });
	}
}

export async function chatTokenNames(prompt?: string) {
	// User wants a token for the selected token
	if (!prompt) {
		if (canvas.tokens!.controlled.length === 1) {
			const token = canvas.tokens!.controlled[0];
			const actor = token.actor;
			if (!actor || !actor.name) return;
			const id = await rpgm.chat.createMessage("rpgm-forge", "names");
			rpgm.forge!.setName(id, { tokenId: token.id, names: [], prompt: actor.name });
		} else {
			rpgm.forge!.logger.errorU("Select a token to generate names for");
		}
	}
	// User has a name for us to use
	else {
		const id = await rpgm.chat.createMessage("rpgm-forge", "names");
		rpgm.forge!.setName(id, { names: [], prompt });
	}
}

export async function generateTokenNames(tokenDocument: TokenDocument, name?: string): Promise<ForgeResponse<Names>> {
	const actor = tokenDocument.actor;
	if (!actor?.name) return { success: false, error: "Token has no name!" };
	const options: NamesOptions = {
		quantity: 4,
		gender: "random",
		genre: "Fantasy",
		method: "ai",
		type: name ?? actor.name
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

export async function renameToken(tokenDocument: TokenDocument, name?: string) {
	const result = await generateTokenNames(tokenDocument, name);
	if (result.success)
		//@ts-expect-error Unsafe updating of tokenDocument
		await tokenDocument.update({ name: result.output[0] }, {});
}

export function registerTokenCreate() {
	Hooks.on("createToken", async (tokenDocument: TokenDocument) => renameToken(tokenDocument)
	);
}
