import fs from "fs";
import { basename, resolve } from "path";
import { pathToFileURL } from "url";
import type { Plugin, ResolvedConfig } from "vite";

const SHARED_LANG = '../lang/*';

/*
 * Generates i18n files
 * Merges shared and module langs into a single file in the build
 */

/**
 * @param langGlob - Where to search for i18n files
 * @returns The GenerateI18n plugin
 */
export function GenerateI18n(langGlob: string): Plugin {
	let config: ResolvedConfig;
	const langs: { [key: string]: LanguageSchema } = {};

	/** Grab language schemas from {@link SHARED_LANG} */
	async function getLangs() {
		const files = fs.globSync(resolve(__dirname, SHARED_LANG));
		for (const file of files) {
			const { default: m }: { default: LanguageSchema } = await import(pathToFileURL(file).href);
			langs[basename(file).split('.')[0]] = m;
		}
	}

	/** 
	 * Merges language schemas recursively
	 * @param a - First language schema
	 * @param b - Second language schema
	 * @returns The merged language schema
	 */
	function mergeDeep(a: LanguageSchema, b: LanguageSchema) {
		const result: LanguageSchema = {};
		for (const key in a) {
			if (key in b && typeof a[key] === "object" && typeof b[key] === "object") {
				result[key] = mergeDeep(a[key], b[key]);
			} else {
				result[key] = a[key];
			}
		}
		for (const key in b) {
			if (!(key in a)) {
				result[key] = b[key];
			}
		}
		return result;
	}

	return {
		name: "rpgm-generatei18n",
		configResolved(c) { config = c; },
		async generateBundle() {
			await getLangs();
			const files = fs.globSync(langGlob);

			for (const file of files) {
				const name = basename(file).split('.')[0];

				const m: LanguageModule = await import(pathToFileURL(file).href);
				const merged = mergeDeep(langs[name], m.default);
				fs.mkdirSync(`${config.build.outDir}/lang`);
				fs.writeFileSync(`${config.build.outDir}/lang/${name}.json`, JSON.stringify(merged, null, 4));
			}
		}
	};
}

type LanguageModule = { default: LanguageSchema }
