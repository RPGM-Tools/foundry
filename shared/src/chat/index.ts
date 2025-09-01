import type { LiteralArgumentBuilder, ParseResults } from 'brigadier-ts-lite';
import { CommandDispatcher } from 'brigadier-ts-lite';
import type { App, Component } from 'vue';
import { createApp } from 'vue';

import AutoComplete from './AutoComplete.vue';
import type { ChatWizard } from './ChatWizard';

/**
 * ChatCommands stores all chat commands and provides utility functions related to chat
 * 
 * The ChatCommands system provides a framework for creating custom chat commands that can be 
 * executed by users in the chat interface. Commands are registered using the brigadier-ts-lite 
 * library which provides a Minecraft-like command syntax with argument parsing and autocompletion.
 * 
 * Commands are prefixed with an asterisk (*) and can be registered by both the shared module 
 * and individual modules like rpgm-forge.
 * 
 * Key Features:
 * - Command registration with brigadier-ts-lite for argument parsing
 * - Autocompletion support in the chat interface
 * - Integration with the ChatWizards system for interactive command interfaces
 * - Message handler registration for custom chat message rendering
 * 
 * Usage:
 * 1. Register commands using `rpgm.chat.registerCommand()` in your module's registerSettings method
 * 2. Use `literal()`, `argument()`, and `string()` functions from brigadier-ts-lite to define command structure
 * 3. Implement command execution logic in the executes() callback
 * 
 * Example:
 * ```typescript
 * rpgm.chat.registerCommand(literal("mycommand")
 *   .then(argument("param", string())
 *     .executes(c => {
 *       // Handle command execution
 *       console.log("Command executed with param:", c.get("param"));
 *     })));
 * ```
 */
export class ChatCommands {
	chatPanel: App | undefined;
	COMMAND_PREFIX = '*';
	private commands = new CommandDispatcher();
	private messageHandlers: ChatWizard[] = [];
	private chatlog?: HTMLElement;

	constructor() {
		// renderChatMessage is deprecated in v13+
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Hooks.on(rpgm.majorGameVersion <= 12 ? 'renderChatMessage' : 'renderChatMessageHTML' as any,
			(message: ChatMessage, html: JQuery | HTMLElement) => {
				for (const handler of this.messageHandlers) {
					const shouldHandle = handler.query(message);
					if (!shouldHandle) continue;
					handler.render(message, rpgm.j(html));
					return;
				}
			});
		Hooks.once('ready', () => { rpgm.chat.createChatPanel(); });

		// Patch chat context menu to not allow revealing wizards
		const _getEntryContextOptions = ChatLog.prototype._getEntryContextOptions.bind(ui.chat);
		ChatLog.prototype._getEntryContextOptions = () => {
			rpgm.tools.logger.debug('Patching chat context menu');
			const options = _getEntryContextOptions();
			for (const option of options) {
				if (option.name === 'CHAT.RevealMessage') {
					const condition = option.condition;
					option.condition = (li: JQuery | HTMLElement) => {
						const message = game.messages.get(rpgm.j(li).dataset.messageId!);
						let wizard = false;
						for (const handler of rpgm.chat.messageHandlers)
							if (handler.query(message!))
								wizard = true;
						return condition(li) && !wizard;
					};
				}
			}
			return options;
		};
	}

	/**
	 * @returns The top and bottom distances in the chat scroll window
	 */
	get scrollDistances() {
		this.chatlog ??= document.querySelector('#chat #chat-log,#chat .chat-scroll') as HTMLElement;
		return {
			top: this.chatlog.scrollTop,
			bottom: this.chatlog.scrollHeight - this.chatlog.scrollTop - this.chatlog.clientHeight
		};
	}

	/**
	 * Scroll to the bottom of the page smoothly.
	 * @param force - Skip checking scroll distance
	 */
	updateScroll(force?: boolean) {
		setTimeout(() => {
			this.chatlog ??= document.querySelector('#chat #chat-log,#chat .chat-scroll') as HTMLElement;
			const { top, bottom } = this.scrollDistances;
			const shouldScroll = force || (top > 300 && bottom < 300);
			if (shouldScroll)
				this.chatlog.scrollBy({ top: 9999, behavior: 'smooth' });
		}, force ? 200 : 500);
	}

	/**
	 * Register a new chat command with the system
	 *
	 * This method registers a new command that can be executed by users in the chat interface.
	 * Commands are defined using the brigadier-ts-lite library which provides a Minecraft-like 
	 * command syntax with argument parsing and autocompletion.
	 * @param command - The command to register, created using literal(), argument(), etc. from brigadier-ts-lite
	 * @example
	 * // Register a simple command without arguments
	 * rpgm.chat.registerCommand(literal("help").executes(() => {
	 *   // Show help text
	 * }));
	 * @example
	 * // Register a command with arguments
	 * rpgm.chat.registerCommand(literal("name")
	 *   .then(argument("prompt", string("greedy_phrase")).executes(c => {
	 *     // Handle command with prompt argument
	 *     void chatTokenNames(undefined, c.get<string>("prompt"));
	 *   }))
	 *   .executes(() => {
	 *     // Handle command without arguments
	 *     void chatTokenNames(undefined);
	 *   }));
	 */
	registerCommand(command: LiteralArgumentBuilder) {
		this.commands.register(command);
	}

	/**
	 * Register a new message handler with the system
	 *
	 * This method registers a new ChatWizard handler that can render custom content in chat messages.
	 * Message handlers are used by the ChatWizards system to create interactive, persistent chat interfaces.
	 * @param handler - The ChatWizard instance to register for handling specific message types
	 * @example
	 * // Register a wizard for handling name generation
	 * const nameChats = new ChatWizard<ForgeChatNames>(
	 *   "rpgm-forge",
	 *   "name",
	 *   NamesChat as Component,
	 *   "Name Generator"
	 * );
	 * rpgm.chat.registerMessageHandler(nameChats);
	 */
	registerMessageHandler(handler: ChatWizard) {
		this.messageHandlers.push(handler);
	}

	/**
	 * Execute a chat command
	 *
	 * This method executes a registered chat command with the provided command string.
	 * The command string should not include the command prefix (*).
	 * @param command - The command to execute (without the * prefix)
	 * @returns The exit code of the command execution
	 * @example
	 * // Execute the "help" command
	 * rpgm.chat.execute("help");
	 * @example
	 * // Execute the "name" command with arguments
	 * rpgm.chat.execute("name dragon");
	 */
	execute(command: string) {
		return this.commands.execute(command);
	}

	/**
	 * Parse a chat command
	 *
	 * This method parses a command string and returns the parse results.
	 * This is primarily used internally for command autocompletion.
	 * @param command - The command to parse (without the * prefix)
	 * @returns The parse results containing information about the command structure
	 */
	parse(command: string) {
		return this.commands.parse(command);
	}

	/**
	 * Get command completion suggestions
	 *
	 * This method returns completion suggestions for a parsed command.
	 * This is used by the AutoComplete component to provide autocompletion in the chat interface.
	 * @param parse - The parse results to interpret
	 * @returns A list of completion suggestions for the current command context
	 */
	getCompletionSuggestions(parse: ParseResults) {
		return this.commands.getCompletionSuggestions(parse);
	}

	/** Creates the {@link AutoComplete} app. */
	createChatPanel() {
		const chatInput = rpgm.majorGameVersion === 12 ? document.querySelector('#chat-form')
			: document.querySelector('#chat-message');
		if (!chatInput) { rpgm.tools.logger.error('Couldn\'t find the chat input!'); return; };
		this.chatPanel = createApp(AutoComplete as Component);
		const panelContainer = document.createElement('div');

		this.chatPanel.mount(panelContainer);
	}

	/** Removes all messages that are no longer in the game. */
	prune() {
		for (const handler of this.messageHandlers)
			handler.prune();
	}
}
