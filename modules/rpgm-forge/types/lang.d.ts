declare global {
	interface RpgmI18nCombined {
		langs: [RpgmI18n, ForgeI18n]
	}
	interface ForgeI18n {
		RPGM_FORGE: {
			CONFIG: {
				AUTO_NAME: string
				AUTO_NAME_HINT: string
				RENAME_ACTORS: string
				RENAME_ACTORS_HINT: string
				LANGUAGE: string
				LANGUAGE_HINT: string
				SYSTEM: string
				SYSTEM_HINT: string
				GENRE: string
				GENRE_HINT: string
			}
			INIT: {
				TITLE: string
				PROMPT1: string
				PROMPT3: string
				PROMPT4: string
				BUTTON: string
			}
			PROVIDERS: {
				RPGM: string
				CUSTOM: string
				OFFLINE_NAMES: string
				ADJECTIVE_NAMES: string
			}
			HOMEBREW: {
				PLACEHOLDER: string
			}
			ERRORS: {
				TOKEN_SELECT: string
				TOKEN_OWNER: string
				TEXT_LIMIT: string
			}
			RADIAL_MENU: {
				NAMES: string
				DESCRIPTION: string
				D4: string
				D6: string
				LOREM_IPSUM: string
				START_SHIMMER: string
				STOP_SHIMMER: string
				DELETE: string
				REGENERATE: string
				COPY: string
				SEND_TO_JOURNAL: string
				OPEN_JOURNAL: string
			}
		}
	}
}

export { };
