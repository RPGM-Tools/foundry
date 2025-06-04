import type { LiteralArgumentBuilder, ParseResults } from "brigadier-ts-lite";
import { CommandDispatcher } from "brigadier-ts-lite";
import { type App, type Component, createApp } from 'vue';
import AutoComplete from "./AutoComplete.vue";
import type { ChatWizard } from "./ChatWizard";

/**
 * ChatCommands stores all rp-commands and provides utility functions related to chat
 */
export class ChatCommands {
	chatPanel: App | undefined;
	COMMAND_PREFIX = '*';
	private commands = new CommandDispatcher();
	private messageHandlers: ChatWizard[] = [];
	private chatlog?: HTMLElement;

	constructor() {
		// renderChatMessage is deprecated in v13+
		if (rpgm.majorGameVersion <= 12)
			Hooks.on("renderChatMessage", (message, html) => {
				for (const handler of this.messageHandlers) {
					const shouldHandle = handler.query(message);
					if (!shouldHandle) continue;
					return handler.render(message, html.get(0)!);
				}
			});
		else
			Hooks.on("renderChatMessageHTML", (message, html) => {
				for (const handler of this.messageHandlers) {
					const shouldHandle = handler.query(message);
					if (!shouldHandle) continue;
					return handler.render(message, html);
				}
			});
		Hooks.once("ready", () => { rpgm.chat.createChatPanel(); });
	}

	/**
	 * @returns The top and bottom distances in the chat scroll window
	 */
	get scrollDistances() {
		this.chatlog ??= document.querySelector("#chat #chat-log,#chat .chat-scroll") as HTMLElement;
		return {
			top: this.chatlog.scrollTop,
			bottom: this.chatlog.scrollHeight - this.chatlog.scrollTop - this.chatlog.clientHeight,
		};
	}

	/**
	 * Scroll to the bottom of the page smoothly
	 * @param force - Skip checking scroll distance
	 */
	updateScroll(force?: boolean) {
		setTimeout(() => {
			this.chatlog ??= document.querySelector("#chat #chat-log,#chat .chat-scroll") as HTMLElement;
			const { top, bottom } = this.scrollDistances;
			const shouldScroll = force || (top > 300 && bottom < 300);
			if (shouldScroll)
				this.chatlog.scrollBy({ top: 9999, behavior: "smooth" });
		}, force ? 200 : 500);
	}

	/**
	 * @param command - The command to register
	 */
	registerCommand(command: LiteralArgumentBuilder) {
		if (game.user.isGM)
			this.commands.register(command);
	}

	/**
	 * @param handler - The chat database to register
	 */
	registerMessageHandler(handler: ChatWizard) {
		this.messageHandlers.push(handler);
	}

	/**
	 * @param command - The command to execute
	 * @returns The exit code of the command
	 */
	execute(command: string) {
		return this.commands.execute(command);
	}

	/**
	 * @param command - The command to parse
	 * @returns The parse results
	 */
	parse(command: string) {
		return this.commands.parse(command);
	}

	/**
	 * @param parse - The parse results to interpret
	 * @returns A list of completions
	 */
	getCompletionSuggestions(parse: ParseResults) {
		return this.commands.getCompletionSuggestions(parse);
	}

	/** Creates the {@link AutoComplete} app */
	createChatPanel() {
		const chatInput = rpgm.majorGameVersion === 12 ? document.querySelector("#chat-form")
			: document.querySelector("#chat-message");
		if (!chatInput) { rpgm.logger.error("Couldn't find the chat input!"); return; };
		this.chatPanel = createApp(AutoComplete as Component);
		const panelContainer = document.createElement("div");

		this.chatPanel.mount(panelContainer);
	}

	/** Removes all messages that are no longer in the game */
	prune() {
		for (const handler of this.messageHandlers)
			handler.prune();
	}

}
