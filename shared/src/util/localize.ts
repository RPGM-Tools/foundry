/**
 * Localizes an RPGM-specific key.
 * @param id - The localization key to localize
 * @returns The localized string
 */
export function localize(id: RpgmLangs) {
	return game.i18n.localize(id);
}
