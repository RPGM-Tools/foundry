import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Macros from 'unplugin-macros/vite';
import { loadEnv, type UserConfig } from 'vite';

import { GenerateI18n } from './localize';
import { Versioning } from './versioning';

/**
 * @param id - The module id
 * @param mode - The build mode
 * @param dirname - The current directory
 * @param version - The module version
 * @returns Default Vite config
 */
export default function defaultConfig(
	id: string,
	mode: string,
	dirname: string,
	version: string
): UserConfig {
	const env = loadEnv(mode, dirname);
	const foundryUrl =
		process.env.RPGM_FOUNDRY_URL ??
		process.env.VITE_FOUNDRY_URL ??
		env.RPGM_FOUNDRY_URL ??
		env.VITE_FOUNDRY_URL;
	const stewardUrl =
		process.env.RPGM_STEWARD_URL ??
		env.RPGM_STEWARD_URL ??
		'https://rpgm-steward-dev.rpgm-tools.workers.dev';
	const accountWebBaseUrl =
		process.env.RPGM_ACCOUNT_WEB_BASE_URL ??
		env.RPGM_ACCOUNT_WEB_BASE_URL ??
		'https://rpgm.tools';
	const stewardDevAccessKey =
		process.env.RPGM_STEWARD_DEV_ACCESS_KEY ??
		process.env.STEWARD_DEV_ACCESS_KEY ??
		env.RPGM_STEWARD_DEV_ACCESS_KEY ??
		env.STEWARD_DEV_ACCESS_KEY;
	const stewardProxyHeaders = stewardDevAccessKey
		? {
				'x-steward-dev-access-key': stewardDevAccessKey
			}
		: undefined;
	const stewardProxyOptions = {
		target: stewardUrl,
		changeOrigin: true,
		...(stewardProxyHeaders ? { headers: stewardProxyHeaders } : {})
	};
	const apiUrl =
		process.env.RPGM_API_URL ??
		process.env.VITE_RPGM_URL ??
		env.RPGM_API_URL ??
		env.VITE_RPGM_URL ??
		(mode === 'development' && foundryUrl
			? `http://${process.env.RPGM_DEV_HOST ?? env.RPGM_DEV_HOST ?? '127.0.0.1'}:${process.env.RPGM_DEV_PORT ?? env.RPGM_DEV_PORT ?? '30001'}`
			: undefined) ??
		'https://rpgm.tools';
	const devHost =
		process.env.RPGM_DEV_HOST ?? env.RPGM_DEV_HOST ?? '127.0.0.1';
	const devPort = Number(
		process.env.RPGM_DEV_PORT ?? env.RPGM_DEV_PORT ?? '30001'
	);

	if (mode === 'development' && !foundryUrl) {
		throw new Error(
			'Missing Foundry development target. Set RPGM_FOUNDRY_URL, VITE_FOUNDRY_URL, or use the versioned pnpm dev/test scripts.'
		);
	}

	return {
		root: 'src/',
		publicDir: resolve(dirname, 'public'),
		base: `/modules/${id}/`,
		server: {
			host: devHost,
			fs: {
				allow: [resolve(dirname, '../../../../')]
			},
			hmr: {
				overlay: false
			},
			port: devPort,
			strictPort: true,
			allowedHosts: true,
			proxy: foundryUrl
				? {
						'/api/forge': {
							...stewardProxyOptions
						},
						'/api/v1/forge': {
							...stewardProxyOptions
						},
						[`^(?!/modules/${id})`]: `http://${foundryUrl}`,
						// [`^(/modules/${id}/lang)`]: `http://${foundryUrl}`,
						'/socket.io': {
							target: `ws://${foundryUrl}`,
							ws: true
						}
					}
				: undefined
		},
		resolve: {
			alias: {
				$: resolve(dirname, 'src'),
				$$: dirname,
				'#': resolve(dirname, '../../shared/src'),
				'##': resolve(dirname, '../../shared')
			}
		},
		define: {
			__MODULE_VERSION__: `"${version}"`,
			__API_URL__: JSON.stringify(apiUrl),
			__RPGM_ACCOUNT_WEB_BASE_URL__: JSON.stringify(accountWebBaseUrl),
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
		},
		assetsInclude: ['**/*.glsl'],
		envPrefix: 'RPGM_',
		build: {
			assetsInlineLimit: (path: string) =>
				['.glsl', '.png'].some(f => path.startsWith(f)),
			chunkSizeWarningLimit: 1000,
			outDir: resolve(dirname, '.dist'),
			emptyOutDir: true,
			// // This wasn't minifying correctly, try enabling if things break
			// lib: {
			// 	name: "rpgm-tools",
			// 	entry: resolve(__dirname, "./src/init.ts"),
			// 	formats: ["es"],
			// 	fileName: "init"
			// },
			rollupOptions: {
				input: resolve(dirname, 'src/init.js'),
				output: {
					manualChunks: {
						'better-auth': ['better-auth'],
						btsl: ['brigadier-ts-lite'],
						naiveui: ['naive-ui'],
						polar: ['@polar-sh/better-auth', '@polar-sh/sdk'],
						showdown: ['showdown'],
						'vue-router': ['vue-router'],
						vue: ['vue'],
						zod: ['zod', 'zod/mini']
					},
					assetFileNames: () => {
						return 'assets/[name][extname]';
					},
					entryFileNames: '[name].js'
				},
				preserveEntrySignatures: 'strict'
			}
		},
		plugins: [
			vue(),
			Macros(),
			AutoImport({ imports: ['vue'] }),
			Versioning(version),
			GenerateI18n(resolve(dirname, './lang/*'), id)
		]
	};
}
