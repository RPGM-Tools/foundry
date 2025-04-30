/* eslint-disable no-console */
/**
 * This file facilitates the ability for package.json to be the source of truth
 * for our module's version. It will update the version in all the relevant places
 * during development and in the build
 */
import type { PluginOption, ResolvedConfig } from "vite";
import { existsSync, readFile, writeFile } from 'node:fs';

/** Set version number in module.json */
export function Versioning(version: string): PluginOption {
	let config: ResolvedConfig;
	const moduleFile = () => `${config.build.outDir}/module.json`;
	return {
		name: "versioning",

		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},

		// Process dev server
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url?.endsWith("module.json")) {
					if (existsSync(moduleFile())) {
						readFile(moduleFile(), "utf8", function(err, data) {
							if (err) return next(err);
							const result = data.replaceAll(/{{RPGM_VERSION}}/g, version);
							res.setHeader('Content-Type', 'application/json');
							res.end(result);
						});
						return;
					}
				}
				next();
			});
		},

		// Process build output
		closeBundle() {
			readFile(moduleFile(), "utf8", function(err, data) {
				if (err) return console.error(err);
				const result = data.replaceAll(/{{RPGM_VERSION}}/g, version);
				writeFile(moduleFile(), result, function(err) {
					if (err) return console.error(err);
				});
			});
		}
	};
}
