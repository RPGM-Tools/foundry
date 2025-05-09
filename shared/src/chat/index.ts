import type { LiteralArgumentBuilder, ParseResults } from "brigadier-ts-lite";
import { CommandDispatcher } from "brigadier-ts-lite";
import { type App, type Component, createApp } from 'vue';
import AutoComplete from "./AutoComplete.vue";
import type { ChatDatabase } from "./ChatDatabase";

export class ChatCommands {
	chatPanel: App | undefined;
	COMMAND_PREFIX = '*';
	private commands = new CommandDispatcher();
	private messageHandlers: ChatDatabase<object>[] = [];
	private messageRenderers: ((id: string, message: ChatMessage, html: JQuery) => Component | undefined)[] = [];

	constructor() {
		Hooks.on("chatMessage", (...args) => this.handleMessage(...args));
		Hooks.on("renderChatMessage", (message, html) => {
			for (const handler of this.messageHandlers) {
				const shouldHandle = handler.query(message);
				if (!shouldHandle) continue;
				handler.render(message, html);
				break;
			}
		});
		Hooks.once("ready", () => { rpgm.chat.createChatPanel(); });
	}

	async createMessage(moduleId: string, key: string) {
		const message = await ChatMessage.create({
			speaker: { alias: "RPGM Tools" },
			whisper: game.userId,
			content: `<div class="rpgm-placeholder">If you are seeing this, please install ${moduleId}</div>`,
			//@ts-expect-error Type error with flags
			flags: { [moduleId]: key },
		}, { broadcast: false, render: false, renderSheet: false });
		return message!.id!;
	}

	getScrollDistance(chatlog?: HTMLElement) {
		chatlog ??= document.querySelector("#chat #chat-log") as HTMLElement;
		return chatlog.scrollTop + chatlog.clientHeight - chatlog.scrollHeight;
	}

	updateScroll(chatlog?: HTMLElement, force?: boolean) {
		setTimeout(() => {
			chatlog ??= document.querySelector("#chat #chat-log") as HTMLElement;
			const scrolledToBottom = this.getScrollDistance(chatlog) >= -100;

			if (force || scrolledToBottom)
				chatlog.scrollBy({ top: 9999, behavior: "smooth" });
		}, force ? 200 : 500);
	}

	registerMessageHandler(handler: ChatDatabase<object>) {
		this.messageHandlers.push(handler);
	}

	registerMessageRenderer(handler: typeof this.messageRenderers[number]) {
		this.messageRenderers.push(handler);
	}

	registerCommand(command: LiteralArgumentBuilder) {
		this.commands.register(command);
	}

	execute(parse: string) {
		return this.commands.execute(parse);
	}

	parse(command: string) {
		return this.commands.parse(command);
	}

	getCompletionSuggestions(parse: ParseResults) {
		return this.commands.getCompletionSuggestions(parse);
	}

	createChatPanel() {
		const chatInput = rpgm.majorGameVersion === 12 ? document.querySelector("#chat-form")
			: document.querySelector("#chat-message");
		if (!chatInput) return rpgm.logger.error("Couldn't find the chat input!");
		this.chatPanel = createApp(AutoComplete as Component);
		const panelContainer = document.createElement("div");

		this.chatPanel.mount(panelContainer);
	}

	handleMessage(_: ChatLog, message: string, _1: { user: string; speaker: ReturnType<ChatMessage.ImplementationClass["getSpeaker"]>; },): boolean | void {
		if (message.startsWith('*')) {
			try {
				rpgm.chat.execute(message.slice(1));
			} catch {
				rpgm.logger.errorU("An error occured when executing the command!");
			}
			return false;
		}
	}
}
