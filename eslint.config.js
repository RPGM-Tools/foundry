import eslint from '@eslint/js';
import vuelint from 'eslint-plugin-vue'
import tslint from "typescript-eslint";

export default tslint.config([
	{
		ignores: ["**/.dist/"],
		extends: [
			eslint.configs.recommended,
			...tslint.configs.recommendedTypeChecked,
			...vuelint.configs['flat/strongly-recommended'],
		],
		files: ["**/*.{ts,vue}"],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				projectService: true,
				extraFileExtensions: ["vue"],
				parser: tslint.parser
			},
		},
		rules: {
			semi: "warn",
			"no-console": "error",
			"prefer-const": "error",
			"@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: 'with-single-extends' }],
		}
	},
	// ...vuelint.configs['flat/strongly-recommended'],
	// eslint.configs.recommended,
	// tslint.configs.recommendedTypeChecked.map((config) => ({
	// 	...config,
	// 	files: ["**/*.{ts,vue}"],
	// })),
	// {
	// 	languageOptions: {
	// 		parserOptions: {
	// 			projectService: true,
	// 			tsconfigRootDir: import.meta.dirname,
	// 			projectFolderIgnoreList: [
	// 				"**/.dist"
	// 			],
	// 		},
	// 	},
	// 	plugins: {
	// 		"@typescript-eslint": tslint.plugin
	// 	},
	// 	files: [
	// 		"**/*.ts"
	// 	],
	// 	rules: {
	// 		semi: "warn",
	// 		"no-console": "error",
	// 		"prefer-const": "error",
	// 		"@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: 'with-single-extends' }],
	// 	},
	// },
]);

