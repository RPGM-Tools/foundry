/**
 * File: vite.config.ts
 * Purpose: Extends the shared Vite configuration for the RPGM Forge module and
 *          injects dev-time middleware for static assets.
 * Last Updated: 2025-11-11
 */
import { defineConfig, mergeConfig } from 'vite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import defaultConfig from '../../shared/vite/vite.config';
import { version } from './package.json';

export default defineConfig(({ mode }) => {
	const id = 'rpgm-forge';
	const baseConfig = defaultConfig(id, mode, __dirname, version);
	const cssFiles = [
		resolve(__dirname, '../../shared/src/style/css/components.css'),
		resolve(__dirname, '../../shared/src/style/css/overrides.css'),
		resolve(__dirname, '../../shared/src/style/css/sidebar.css'),
		resolve(__dirname, '../../shared/src/style/css/transitions.css'),
		resolve(__dirname, '../../shared/src/style/css/utilities.css')
	];
	return mergeConfig(
		baseConfig,
		defineConfig({
			plugins:
				mode === 'development'
					? [
							{
								name: 'rpgm-forge-dev-init-css',
								configureServer(server) {
									server.middlewares.use(async (req, res, next) => {
										if (!req.url?.endsWith('/assets/init.css')) return next();
										try {
											const css = await Promise.all(
												cssFiles.map(file => readFile(file, 'utf8'))
											);
											res.setHeader('Content-Type', 'text/css; charset=utf-8');
											res.end(css.join('\n'));
											return;
										} catch (error) {
											return next(error);
										}
									});
								}
							}
					  ]
					: []
		})
	);
});
