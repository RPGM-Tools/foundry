import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import jsdoclint from 'eslint-plugin-jsdoc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import vuelint from 'eslint-plugin-vue';
import tslint from 'typescript-eslint';

export default tslint.config([
	{
		extends: [
			eslint.configs.recommended,
			...tslint.configs.recommended,
			...vuelint.configs['flat/recommended'],
			jsdoclint.configs['flat/stylistic-typescript'],
			jsdoclint.configs['flat/contents-typescript']
		],
		files: ['**/*.{js,ts,vue}'],
		ignores: ['**/.dist/**/*'],
		languageOptions: {
			ecmaVersion: 'latest',
			parserOptions: {
				extraFileExtensions: ['ts', 'vue', 'js'],
				parser: tslint.parser,
				project: './tsconfig.json',
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			},
			sourceType: 'module'
		},
		plugins: {
			'@stylistic': stylistic,
			'simple-import-sort': simpleImportSort
		},
		rules: {
			'@stylistic/comma-dangle': 'warn',
			'@stylistic/quotes': ['warn', 'single'],
			'@stylistic/semi': 'warn',
			'@stylistic/comma-spacing': ['warn', { before: false, after: true }],
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{
					fixStyle: 'separate-type-imports'
				}
			],
			'@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unused-vars': ['error', {
				'argsIgnorePattern': '^_',
				'caughtErrors': 'all',
				'caughtErrorsIgnorePattern': '^_',
				'caughtErrorsIgnorePattern': '^_',
				'destructuredArrayIgnorePattern': '^_',
				'ignoreRestSiblings': true,
				'varsIgnorePattern': '^_'
			}],
			'jsdoc/require-hyphen-before-param-description': ['warn', 'always'],
			'no-console': 'error',
			'prefer-const': 'error',
			'simple-import-sort/exports': 'warn',
			'simple-import-sort/imports': 'warn',
			// "jsdoc/require-jsdoc": ["warn", {
			// 	require: {
			// 		ClassDeclaration: true,
			// 		FunctionDeclaration: true,
			// 		MethodDefinition: true,
			// 	},
			// 	checkConstructors: false,
			// 	enableFixer: false,
			// }],
			'vue/html-indent': ['warn', 'tab'],
			// 'vue/html-closing-bracket-newline': 'off',
			'vue/no-v-html': 'off'
			// 'vue/sort-keys': ['warn', 'asc', {
			// 	'caseSensitive': true,
			// 	'ignoreChildrenOf': ['model'],
			// 	'ignoreGrandchildrenOf': ['computed', 'directives', 'inject', 'props', 'watch'],
			// 	'minKeys': 2,
			// 	'natural': true
			// }]
			// 'vue/first-attribute-linebreak': 'off',
			// 'vue/max-attributes-per-line': 'off',
			// 'vue/multiline-html-element-content-newline': 'off',
			// 'vue/singleline-html-element-content-newline': 'off',
		}
	}
]);
