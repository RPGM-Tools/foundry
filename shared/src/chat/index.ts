import type { LiteralArgumentBuilder, ParseResults } from "brigadier-ts-lite";
import { CommandDispatcher } from "brigadier-ts-lite";
import { type App, type Component, createApp } from 'vue';
import AutoComplete from "./AutoComplete.vue";

export class ChatCommands {
	chatPanel: App | undefined;
	COMMAND_PREFIX = '*';
	private commands = new CommandDispatcher();
	private messageHandlers: ((id: string, message: ChatMessage, html: JQuery) => Component | undefined)[] = [];

	constructor() {
		Hooks.on("chatMessage", (...args) => this.handleMessage(...args));
		Hooks.on("renderChatMessage", (message, html) => {
			for (const handler of this.messageHandlers) {
				const component = handler(message.id!, message, html);
				if (!component) continue;
				const mount = html.find(".rpgm-placeholder").get(0);
				const app = createApp(component);
				app.provide("message", message);
				app.mount(mount as HTMLElement);
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

	updateScroll(chatlog?: HTMLElement) {
		setTimeout(() => {
			chatlog ??= document.querySelector("#chat #chat-log") as HTMLElement;
			const scrolledToBottom = chatlog.scrollTop + chatlog.clientHeight - chatlog.scrollHeight >= -60;

			if (scrolledToBottom)
				chatlog.scrollBy({ top: 9999, behavior: "smooth" });
		}, 1000);
	}

	registerMessageRenderer(handler: typeof this.messageHandlers[number]) {
		this.messageHandlers.push(handler);
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
