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
export default function defaultConfig(id: string, mode: string, dirname: string, version: string): UserConfig {
	const env = loadEnv(mode, dirname);

	return {
		root: 'src/',
		publicDir: resolve(dirname, 'public'),
		base: `/modules/${id}/`,
		server: {
			hmr: {
				overlay: false
			},
			port: 30001,
			allowedHosts: true,
			proxy: {
				[`^(?!/modules/${id})`]: `http://${env.VITE_FOUNDRY_URL}`,
				// [`^(/modules/${id}/lang)`]: `http://${env.VITE_FOUNDRY_URL}`,
				'/socket.io': {
					'target': `ws://${env.VITE_FOUNDRY_URL}`,
					ws: true
				}
			}
		},
		resolve: {
			alias: {
				'$': resolve(dirname, 'src'),
				'$$': dirname,
				'#': resolve(dirname, '../../shared/src'),
				'##': resolve(dirname, '../../shared')
			}
		},
		define: {
			'__MODULE_VERSION__': `"${version}"`,
			'__API_URL__': JSON.stringify(env.VITE_RPGM_URL ?? 'https://api.rpgm.tools'),
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
		},
		assetsInclude: [
			'**/*.glsl'
		],
		envPrefix: 'RPGM_',
		build: {
			assetsInlineLimit: ((path: string) => ['.glsl', '.png'].some(f => path.startsWith(f))),
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
						'rpgm-tools': ['@rpgm/tools', '@rpgm/tools/forge'],
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
};
