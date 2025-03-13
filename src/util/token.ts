import { MuseNames, NamesOptions } from '@rpgm/muse'
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
		const result = await MuseNames.fromOptions(options).generate()
		if (!result.success)
			logging.errorU(result.error)
		else {
			tokenDocument.update({ name: result.output.names[0] }, {})
		}
	})
}
