declare global {
	interface RpgmI18nCombined {
		langs: [RpgmI18n, VaultI18n]
	}
	interface VaultI18n {
		RPGM_VAULT: {
			RADIAL_MENU: {
				SAVE
				ANALYZE
			}
		}
	}
}

export { };
