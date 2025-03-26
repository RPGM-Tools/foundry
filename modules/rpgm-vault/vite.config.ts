import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path'
import { version } from './package.json'
import { Versioning } from '#/versioning'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd())

	return defineConfig({
		root: "src/",
		base: "/modules/rpgm-vault/",
		publicDir: resolve(__dirname, "public"),
		server: {
			port: 30001,
			proxy: {
				"^(?!/modules/rpgm-vault)": `http://${env.VITE_FOUNDRY_URL}`,
				"/socket.io": {
					"target": `ws://${env.VITE_FOUNDRY_URL}`,
					ws: true,
				},
			}
		},
		resolve: {
			alias: {
				'@': resolve(__dirname, 'src'),
				'#': resolve(__dirname, "../../shared/src"),
			},
		},
		define: {
			"__API_URL__": JSON.stringify(env.VITE_RPGM_URL ?? "https://api.rpgm.tools"),
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		},
		envPrefix: "RPGM_",
		keepProcessEnv: false,
		build: {
			outDir: resolve(__dirname, "dist"),
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
						return "[name][extname]"
					},
					entryFileNames: "[name].js",
				},
				preserveEntrySignatures: "strict",
			},
		},
		plugins: [
			vue(),
			Versioning(version),
		]
	})
})
