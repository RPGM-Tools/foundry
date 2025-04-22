import { ForgeNames } from '@rpgm/forge'
import { shimmerToken } from './shimmer'

export async function generateTokenNames(tokenDocument: TokenDocument) {
	const actor = tokenDocument.actor
	if (!actor?.name) return
	const options: NamesOptions = {
		quantity: 4,
		gender: "random",
		genre: "Fantasy",
		method: "ai",
		type: actor.name
	}
	const token = canvas.tokens?.get(tokenDocument._id ?? "")
	let shimmerFilter
	if (token) {
		shimmerFilter = shimmerToken(token)
		shimmerFilter.fadeIn(500)
	}
	const result = await ForgeNames.fromOptions(options).generate({
		auth_token: game.settings.get("rpgm-tools", "api_key")
	})
	if (!result.success)
		rpgm.logger.errorU(result.error)
	else {
		//@ts-ignore 
		tokenDocument.update({ name: result.output.names[0] }, {})
	}
	if (shimmerFilter)
		shimmerFilter.fadeOut(500)
}

export function registerTokenCreate() {
	Hooks.on("createToken", async (tokenDocument: TokenDocument) => generateTokenNames(tokenDocument)
	)
}
