import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import { version } from './package.json';
import { GenerateI18n, Versioning } from '##/vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());

	return defineConfig({
		root: "src/",
		base: "/modules/rpgm-forge/",
		publicDir: resolve(__dirname, "public"),
		server: {
			port: 30001,
			proxy: {
				"^(?!/modules/rpgm-forge)": `http://${env.VITE_FOUNDRY_URL}`,
				"^(/modules/rpgm-forge/lang)": `http://${env.VITE_FOUNDRY_URL}`,
				"/socket.io": {
					"target": `ws://${env.VITE_FOUNDRY_URL}`,
					ws: true,
				},
			}
		},
		resolve: {
			alias: {
				'@': resolve(__dirname, 'src'),
				'@@': __dirname,
				'#': resolve(__dirname, "../../shared/src"),
				'##': resolve(__dirname, "../../shared"),
			},
		},
		define: {
			"__API_URL__": JSON.stringify(env.VITE_RPGM_URL ?? "https://api.rpgm.tools"),
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
			"__RPGM_MODULE__": `"RPGM_FORGE"`
		},
		envPrefix: "RPGM_",
		keepProcessEnv: false,
		build: {
			outDir: resolve(__dirname, ".dist"),
			emptyOutDir: true,
			// // This wasn't minifying correctly, try enabling if things break
			// lib: {
			// 	name: "rpgm-tools",
			// 	entry: resolve(__dirname, "./src/init.ts"),
			// 	formats: ["es"],
			// 	fileName: "init"
			// },
			rollupOptions: {
				input: resolve(__dirname, "src/init.ts"),
				output: {
					assetFileNames: () => {
						return "[name][extname]";
					},
					entryFileNames: "[name].js",
				},
				preserveEntrySignatures: "strict",
			},
		},
		plugins: [
			vue(),
			Versioning(version),
			GenerateI18n(resolve(__dirname, "./lang/*")),
		]
	});
});
