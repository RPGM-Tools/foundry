import { ForgeNames } from '@rpgm/forge'
import * as logging from '#/util/logging'
import { shimmer, Shimmer } from './shimmer'

export function registerTokenCreate() {
	Hooks.on("createToken", async (tokenDocument: TokenDocument) => {
		const options: NamesOptions = {
			quantity: 4,
			gender: "random",
			genre: "Fantasy",
			method: "ai",
			type: tokenDocument.name
		}
		const token = canvas.tokens?.get(tokenDocument._id ?? "")
		let shimmerFilter: Shimmer | null = null
		if (token) {
			shimmerFilter = shimmer(token)
			shimmerFilter.fadeIn(500)
		}
		const result = await ForgeNames.fromOptions(options).generate({
			auth_token: game.settings.get("rpgm-tools", "api_key")
		})
		if (!result.success)
			logging.errorU(result.error)
		else {
			console.log(result.output)
			tokenDocument.update({ name: result.output.names[0] }, {})
		}
		if (shimmerFilter)
			shimmerFilter.fadeOut(500)
	})
}

// Hooks.once("ready", async () => {
// 	canvas.tokens?.objects?.children.forEach(async (token) => {
// 		if (token instanceof Token) {
// 			const shimmerFilter = shimmer(token)
// 			await new Promise(resolve => setTimeout(resolve, 1000))
// 			await shimmerFilter.fadeIn(500)
// 			// await new Promise(resolve => setTimeout(resolve, 1000))
// 			// await shimmerFilter.fadeOut(500)
// 		}
// 	})
// })
