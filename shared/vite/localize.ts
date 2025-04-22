import fs from "fs";
import { basename, resolve } from "path";
import type { Plugin, ResolvedConfig } from "vite";

const SHARED_LANG = './lang/*'

/*
 * Generates i18n files
 * Merges shared and module langs into a single file in the build
 */

export function GenerateI18n(langGlob: string): Plugin {
	let config: ResolvedConfig
	let langs: { [key: string]: any } = {}

	async function getLangs() {
		const files = fs.globSync(resolve(__dirname, SHARED_LANG))
		for (const file of files) {
			const { default: m } = await import(file)
			langs[basename(file).split('.')[0]] = m
		}
	}

	return {
		name: "rpgm-generatei18n",
		configResolved(c) { config = c },
		async generateBundle() {
			await getLangs()
			const files = fs.globSync(langGlob)
			for (const file of files) {
				const name = basename(file).split('.')[0]

				const { default: m } = await import(file)
				const merged = { ...langs[name], ...m }
				fs.mkdirSync(`${config.build.outDir}/lang`)
				fs.writeFileSync(`${config.build.outDir}/lang/${name}.json`, JSON.stringify(merged, null, 4))
			}
		}
	}
}
