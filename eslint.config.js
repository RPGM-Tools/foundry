import eslint from '@eslint/js';
import vuelint from 'eslint-plugin-vue'
import tslint from "typescript-eslint";
import jsdoclint from "eslint-plugin-jsdoc";

export default tslint.config([
	{
		ignores: ["**/.dist/"],
		extends: [
			eslint.configs.recommended,
			...tslint.configs.recommended,
			// jsdoclint.configs['flat/recommended-typescript'],
			...vuelint.configs['flat/recommended'],
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
			"@typescript-eslint/consistent-type-imports": "warn",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			// "jsdoc/require-jsdoc": ["warn", {
			// 	require: {
			// 		ClassDeclaration: true,
			// 		FunctionDeclaration: true,
			// 		MethodDefinition: true,
			// 	},
			// 	checkConstructors: false,
			// 	enableFixer: false,
			// }],
			// "jsdoc/require-hyphen-before-param-description": "warn",
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
