import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path'
import { version } from '#/package.json'
import { Versioning } from '#/versioning'

const OUT_DIR = "dist"

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd())

	// Set constants to be baked into the module
	process.env.RPGM_VERSION = version
	process.env.RPGM_DEBUG = process.env.DEV

	return defineConfig({
		root: "src/",
		base: "/modules/rpgm-tools/",
		publicDir: resolve(__dirname, "public"),
		server: {
			port: 30001,
			proxy: {
				"^(?!/modules/rpgm-tools)": `http://${env.VITE_FOUNDRY_URL}`,
				"/socket.io": {
					"target": `ws://${env.VITE_FOUNDRY_URL}`,
					ws: true,
				},
			}
		},
		resolve: {
			alias: {
				'@': resolve(__dirname, 'src'),
				'#': resolve(__dirname),
			},
		},
		envPrefix: "RPGM_",
		build: {
			outDir: resolve(__dirname, OUT_DIR),
			emptyOutDir: true,
			lib: {
				name: "rpgm-tools",
				entry: resolve(__dirname, "./src/index.ts"),
				formats: ["es"],
				fileName: "index"
			},
		},
		plugins: [
			Versioning()
		]
	})
})
