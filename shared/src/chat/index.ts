import ChatPanel from "./ChatPanel.vue"
import { type App, createApp } from 'vue'

export class ChatCommands {
	chatPanel: App | undefined
	commands: ChatCommand[] = []
	COMMAND_PREFIX = '*'

	constructor() {
		Hooks.on("chatMessage", (...args) => this.handleMessage(...args))
	}

	createChatPanel() {
		const chatInput = rpgm.majorGameVersion === 12 ? document.querySelector("#chat-form")
			: document.querySelector("#chat-message")
		if (!chatInput) return rpgm.logger.error("Couldn't find the chat input!")
		this.chatPanel = createApp(ChatPanel)
		const panelContainer = document.createElement("div")

		this.chatPanel.mount(panelContainer)
	}

	// @ts-ignore
	handleMessage(chatLog: ChatLog, message: string, chatData: { user: string; speaker: ReturnType<ChatMessage.ImplementationClass["getSpeaker"]>; },): boolean | void {
		if (message.startsWith('*')) {
			rpgm.logger.logU("Caught message: " + message)
			return false
		}
	}
}
