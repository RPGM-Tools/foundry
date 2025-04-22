declare global {
	export type RpgmLang = ToString<RpgmI18n>
	export type RpgmLangs = ObjectDotNotation<RpgmLang>
	interface RpgmI18n {
		LOGGING: {
			READY
		},
		CONFIG: {
			SECRETS_SETTINGS
			SECRETS_SETTINGS_HINT
			SECRETS_SETTINGS_SUBTITLE
			RADIAL_MENU_SETTINGS
			RADIAL_MENU_SETTINGS_HINT
			RADIAL_MENU_SETTINGS_SUBTITLE
			DEVELOPER_SETTINGS
			DEVELOPER_SETTINGS_HINT
			DEVELOPER_SETTINGS_SUBTITLE
			RADIAL_MENU_ENABLED
			RADIAL_MENU_ENABLED_HINT
			API_KEY
			API_KEY_HINT
			DEBUG_MODE
			DEBUG_MODE_HINT
		},
		RADIAL_MENU: {
			NAMES
			INFO
			D4
			D6
			LOREM_IPSUM
			START_SHIMMER
			STOP_SHIMMER
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

export { }
