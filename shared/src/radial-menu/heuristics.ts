import * as logging from "#/util/logging"

export function contextHeuristics(context: InputContext) {
	let flag = false
	let chatAllowed = false

	function defaults() {
		// Prevent attaching to any input which contains "search"
		flag ||= context.element.outerHTML.toLowerCase().includes("search")
		// Don't attach to chat interface by default
		if (!chatAllowed)
			flag ||= context.element.id === "chat-message"
	}

	const api = {
		/** Get the result of the heuristics */
		get value() {
			defaults()
			return !flag
		},
		/** Only inputs with text content are allowed */
		noNumber() {
			flag ||= /^\d+$/.test(context.getValue())
			return api
		},
		isGM() {
			flag ||= !game.user.isGM
			return api
		},
		/** Attach button to the main chat interface */
		isChat() {
			chatAllowed = true
			if (context.element.id === "chat-message") logging.log("Found chat-message!")
			flag ||= context.element.id !== "chat-message"
			return api
		},
	}

	return api
}

