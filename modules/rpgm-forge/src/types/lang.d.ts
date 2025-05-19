declare global {
	interface RpgmI18nCombined {
		langs: [RpgmI18n, ForgeI18n]
	}
	interface ForgeI18n {
		RPGM_FORGE: {
			NAMES: {
				REGENERATE_BUTTON
				ASSIGN_TOOLTIP
			}
			CONFIG: {
				AUTO_NAME
				AUTO_NAME_HINT
				RENAME_ACTORS
				RENAME_ACTORS_HINT
			}
			DESCRIPTION: {
				REGENERATE_BUTTON
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
				COPY
				SEND_TO_JOURNAL
				OPEN_JOURNAL
			}
		}
	}
}

export { };
