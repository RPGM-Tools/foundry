import eslint from '@eslint/js';
import vuelint from 'eslint-plugin-vue'
import tslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import jsdoclint from "eslint-plugin-jsdoc";

export default tslint.config([
	{
		ignores: ["**/.dist/"],
		extends: [
			eslint.configs.recommended,
			...tslint.configs.recommended,
			...vuelint.configs['flat/recommended'],
			jsdoclint.configs['flat/stylistic-typescript'],
			jsdoclint.configs['flat/contents-typescript'],
		],
		files: ["**/*.{ts,vue}"],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				project: "./tsconfig.json",
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ["vue"],
				parser: tslint.parser
			},
		},
		plugins: {
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			semi: "warn",
			"no-console": "error",
			"prefer-const": "error",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: 'with-single-extends' }],
			"@typescript-eslint/consistent-type-imports": [
				"warn",
				{
					fixStyle: "separate-type-imports"
				}
			],
			"simple-import-sort/imports": "warn",
			"simple-import-sort/exports": "warn",
			// "jsdoc/require-jsdoc": ["warn", {
			// 	require: {
			// 		ClassDeclaration: true,
			// 		FunctionDeclaration: true,
			// 		MethodDefinition: true,
			// 	},
			// 	checkConstructors: false,
			// 	enableFixer: false,
			// }],
			"jsdoc/require-hyphen-before-param-description": ["warn", "always"],
			"@typescript-eslint/no-unused-vars": ["error", {
				"args": "all",
				"argsIgnorePattern": "^_",
				"caughtErrors": "all",
				"caughtErrorsIgnorePattern": "^_",
				"destructuredArrayIgnorePattern": "^_",
				"varsIgnorePattern": "^_",
				"ignoreRestSiblings": true
			}],
			"vue/html-indent": "off",
			"vue/html-closing-bracket-newline": "off",
			"vue/no-v-html": "off",
			"vue/first-attribute-linebreak": "off",
			"vue/max-attributes-per-line": "off",
			"vue/multiline-html-element-content-newline": "off",
			"vue/singleline-html-element-content-newline": "off",
		}
	},
]);
