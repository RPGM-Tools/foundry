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
			DESCRIPTION: {
				REGENERATE_BUTTON
			}
			ERORRS: {
				TOKEN_SELECT
			}
			RADIAL_MENU: {
				NAMES
				D4
				D6
				LOREM_IPSUM
				START_SHIMMER
				STOP_SHIMMER
			}
		}
	}
}

export { };
