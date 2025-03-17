export function useGame() {
	return game
}

export function localize(key: string) {
	return game.i18n.localize(key)
}
