/* eslint-disable no-console */
import fs from 'fs';
import { basename, resolve } from 'path';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';

const SHARED_LANG = '../lang/*';

/*
 * Generates i18n files
 * Merges shared and module langs into a single file in the build
 */

/**
 * @param langGlob - Where to search for i18n files
 * @returns The GenerateI18n plugin
 */
export function GenerateI18n(langGlob: string, id: string): Plugin {
	const langs: { [key: string]: LanguageSchema } = {};

	/** Grab language schemas from {@link SHARED_LANG}. */
	(async function getLangs() {
		const files = fs.globSync(resolve(__dirname, SHARED_LANG));
		for (const file of files) {
			const { default: m } = await import(pathToFileURL(file).href) as { default: LanguageSchema };
			langs[basename(file).split('.')[0]] = m;
		}
		const moduleFiles = fs.globSync(langGlob);

		for (const file of moduleFiles) {
			const name = basename(file).split('.')[0];

			const m = await import(pathToFileURL(file).href) as LanguageModule;
			langs[name] = mergeDeep(langs[name], m.default);
		}

	}());

	/** 
	 * Merges language schemas recursively.
	 * @param a - First language schema
	 * @param b - Second language schema
	 * @returns The merged language schema
	 */
	function mergeDeep(a: LanguageSchema, b: LanguageSchema) {
		const result: LanguageSchema = {};
		for (const key in a) {
			if (key in b && typeof a[key] === 'object' && typeof b[key] === 'object') {
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
		name: 'rpgm-generatei18n',
		buildStart() {
			const sharedFiles = fs.globSync(resolve(__dirname, SHARED_LANG));
			for (const file of sharedFiles) {
				this.addWatchFile(file);
			}

			const moduleFiles = fs.globSync(langGlob);
			for (const file of moduleFiles) {
				this.addWatchFile(file);
			}
		},
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url?.startsWith(`/modules/${id}/lang/`)) {
					const name = basename(req.url).split('.')[0];
					if (langs[name]) {
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify(langs[name]));
						return;
					}
				}
				next();
			});
		},
		handleHotUpdate(ctx) {
			// If the last folder is 'lang'
			console.log(ctx.file.split('/').at(-2));
			if (ctx.file.split('/').at(-2) === 'lang') {
				ctx.server.ws.send({
					type: 'full-reload',
					triggeredBy: 'rpgm-generatei18n'
				});
			}
			console.log(ctx.file);
		},
		async generateBundle() {
			const files = fs.globSync(langGlob);

			for (const file of files) {
				const name = basename(file).split('.')[0];
				this.emitFile({
					type: 'asset',
					fileName: `lang/${name}.json`,
					source: JSON.stringify(langs[name], null, 4)
				});
			}
		}
	};
}

type LanguageModule = { default: LanguageSchema };
