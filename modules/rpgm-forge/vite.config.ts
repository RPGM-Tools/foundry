import { defineConfig } from 'vite';
import { version } from './package.json';
import defaultConfig from '../../shared/vite/vite.config';

export default defineConfig(({ mode }) => {
	return defaultConfig('rpgm-forge', mode, __dirname, version);
});
