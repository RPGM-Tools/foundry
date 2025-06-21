declare global {
	type RpgmLangs = ObjectDotNotation<I18n_Merged>
	type GetI18nCombinedTypes<T> = T extends { langs: infer A } ? A : never;
	type I18n_Merged = DeepMergeAll<GetI18nCombinedTypes<RpgmI18nCombined>>;
	interface RpgmI18nCombined {
		langs: [RpgmI18n]
	}
	type LanguageSchema = { [key: string]: string | LanguageSchema }
	export interface RpgmI18n {
		RPGM_TOOLS: {
			SIDEBAR: {
				TITLE
			},
			LOGGING: {
				READY
			},
			CONFIG: {
				SECRETS_SETTINGS
				SECRETS_SETTINGS_HINT
				SECRETS_SETTINGS_LABEL
				SECRETS_SETTINGS_SUBTITLE
				RADIAL_MENU_SETTINGS
				RADIAL_MENU_SETTINGS_HINT
				RADIAL_MENU_SETTINGS_LABEL
				RADIAL_MENU_SETTINGS_SUBTITLE
				DEVELOPER_SETTINGS
				DEVELOPER_SETTINGS_HINT
				DEVELOPER_SETTINGS_LABEL
				DEVELOPER_SETTINGS_SUBTITLE
				RADIAL_MENU_INPUT
				RADIAL_MENU_INPUT_HINT
				RADIAL_MENU_HUD
				RADIAL_MENU_HUD_HINT
				RADIAL_MENU_DEBUG
				RADIAL_MENU_DEBUG_HINT
				API_KEY
				API_KEY_HINT
			},
			RADIAL_MENU: {
				INFO
				COMMAND
			}
		}
	}

	type ToString<T> =
		IsAnyOr<T, string> extends true ? string
		: { [K in keyof T]: ToString<T[K]> }
}

type IsAnyOr<T, U> = 0 extends (1 & T) | (1 & U) ? true : false;

type BreakDownObject<O, R = void> = {
	[K in keyof O as string]: K extends string
	? R extends string
	? ObjectDotNotation<O[K], `${R}.${K}`>
	: ObjectDotNotation<O[K], `${K}`>
	: never
}

type ObjectDotNotation<O, R = void> =
	(O extends string
		? (R extends string
			? R
			: never)
		: BreakDownObject<O, R>[keyof BreakDownObject<O, R>])

type DeepMerge<A, B> =
	A extends object
	? B extends object
	? {
		[K in keyof A | keyof B]:
		K extends keyof B
		? K extends keyof A
		? DeepMerge<A[K], B[K]>
		: B[K]
		: K extends keyof A
		? A[K]
		: never
	}
	: B
	: B

type DeepMergeAll<T extends []> =
	T extends [infer A, ...infer B]
	? B extends []
	? ToString<A>
	: DeepMerge<ToString<A>, DeepMergeAll<B>>
	: unknown

export { };
