declare global {
	interface RpgmI18nCombined {
		langs: [RpgmI18n, ForgeI18n]
	}
	interface ForgeI18n {
		RPGM_FORGE: {
			CONFIG: {
				AUTO_NAME
				AUTO_NAME_HINT
				RENAME_ACTORS
				RENAME_ACTORS_HINT
				LANGUAGE
				LANGUAGE_HINT
				SYSTEM
				SYSTEM_HINT
				GENRE
				GENRE_HINT
				METHOD
				METHOD_HINT
				METHOD_AI
				METHOD_SIMPLE
			}
			INIT: {
				TITLE
				PROMPT
				PROMPT2
				SAVE
				SAVED
			}
			NAMES: {
				ASSIGN_TOOLTIP
			}
			HOMEBREW: {
				PLACEHOLDER
			}
			ERORRS: {
				TOKEN_SELECT
			}
			RADIAL_MENU: {
				NAMES
				DESCRIPTION
				D4
				D6
				LOREM_IPSUM
				START_SHIMMER
				STOP_SHIMMER
				DELETE
				REGENERATE
				COPY
				SEND_TO_JOURNAL
				OPEN_JOURNAL
			}
		}
	}
}

export { };
