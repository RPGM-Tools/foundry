declare global {
	interface ChatCommand {
		name: string
		callback: () => void
	}
}
export { }
