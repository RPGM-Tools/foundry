import { resolve } from 'path';
import { loadEnv, type UserConfig } from 'vite';
import { GenerateI18n, Versioning } from '.';
import AutoImport from 'unplugin-auto-import/vite';
import vue from '@vitejs/plugin-vue';

export default function defaultConfig(id: string, mode: string, dirname: string, version: string): UserConfig {
	const env = loadEnv(mode, dirname);

	return {
		root: "src/",
		publicDir: resolve(dirname, "public"),
		base: `/modules/${id}/`,
		server: {
			hmr: {
				overlay: false,
			},
			port: 30001,
			proxy: {
				[`^(?!/modules/${id})`]: `http://${env.VITE_FOUNDRY_URL}`,
				[`^(/modules/${id}/lang)`]: `http://${env.VITE_FOUNDRY_URL}`,
				"/socket.io": {
					"target": `ws://${env.VITE_FOUNDRY_URL}`,
					ws: true,
				},
			}
		},
		resolve: {
			alias: {
				'@': resolve(dirname, 'src'),
				'@@': dirname,
				'#': resolve(dirname, "../../shared/src"),
				'##': resolve(dirname, "../../shared"),
			},
		},
		define: {
			"__MODULE_VERSION__": `"${version}"`,
			"__API_URL__": JSON.stringify(env.VITE_RPGM_URL ?? "https://api.rpgm.tools"),
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		},
		assetsInclude: [
			"**/*.glsl"
		],
		envPrefix: "RPGM_",
		keepProcessEnv: false,
		build: {
			assetsInlineLimit: ((path: string) => [".glsl", ".png"].some(f => path.startsWith(f))),
			outDir: resolve(dirname, ".dist"),
			emptyOutDir: true,
			// // This wasn't minifying correctly, try enabling if things break
			// lib: {
			// 	name: "rpgm-tools",
			// 	entry: resolve(__dirname, "./src/init.ts"),
			// 	formats: ["es"],
			// 	fileName: "init"
			// },
			rollupOptions: {
				input: resolve(dirname, "src/init.js"),
				output: {
					manualChunks: {
						vue: ["vue"],
						btsl: ["brigadier-ts-lite"],
					},
					assetFileNames: () => {
						return `assets/[name][extname]`;
					},
					entryFileNames: "[name].js",
				},
				preserveEntrySignatures: "strict",
			},
		},
		plugins: [
			vue(),
			AutoImport({ imports: ['vue'] }),
			Versioning(version),
			GenerateI18n(resolve(dirname, "./lang/*")),
		]
	};
};
