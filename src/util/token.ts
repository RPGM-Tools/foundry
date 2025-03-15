import { ForgeNames } from '@rpgm/forge'
import * as logging from '@/util/logging'

export function registerTokenCreate() {
	Hooks.on("createToken", async (tokenDocument: TokenDocument) => {
		const options: NamesOptions = {
			quantity: 4,
			gender: "random",
			genre: "Fantasy",
			method: "ai",
			type: tokenDocument.name
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
	})
}
