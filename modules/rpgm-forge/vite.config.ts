import { defineConfig, mergeConfig } from 'vite';
import { version } from './package.json';
import defaultConfig from '../../shared/vite/vite.config';

export default defineConfig(({ mode }) => {
	return mergeConfig(defaultConfig('rpgm-forge', mode, __dirname, version), defineConfig({
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						"iso-639-1": ["iso-639-1"]
					}
				}
			}
		}
	}));
});
