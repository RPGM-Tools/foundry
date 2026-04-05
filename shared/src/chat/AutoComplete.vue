<script setup lang="ts">
import type { ParseResults } from 'brigadier-ts-lite';
import { Suggestions } from 'brigadier-ts-lite';
import type { StyleValue } from 'vue';

import { vFollow } from './VFollow';

const CHAT_MESSAGE = '#chat-message';

type ChatInputElement = (HTMLTextAreaElement | HTMLElement) & {
	value: string;
	focus: () => void;
	__rpgmChatEditor?: {
		view?: {
			state: {
				doc: {
					content: unknown;
				};
			};
		};
	};
};

const messageHook = ref(-1);
const chatInputHook = ref(-1);
const renderChatInputHook = ref(-1);
const chatInput = ref<ChatInputElement | null>(null);
const chatValue = ref('');
const typedChatValue = ref('');
const parseResult = ref<ParseResults>();
const completionIndex = ref(-1);
const completionCursor = ref(-1);

const Statuses = {
	okay: '#00ffae',
	warn: '#ffae00'
};

const suggestions = computed<Suggestions>(() => {
	if (!parseResult.value) return Suggestions.EMPTY;
	const completions = rpgm.chat.getCompletionSuggestions(parseResult.value);
	// completions.suggestions.sort((a, b) => a.tooltip.localeCompare(b.tooltip)).reverse();
	return completions;
});

const status = computed(() => {
	if (
		completionIndex.value >= 0 &&
		completionIndex.value < suggestions.value.suggestions.length
	)
		return Statuses.okay;
	const errors = parseResult.value?.errors;
	if (errors && errors.size > 0) return Statuses.warn;
	return Statuses.okay;
});

const statusStyle = computed<StyleValue>(() => {
	return {
		boxShadow: `inset 0px -4px 10px ${status.value}`
	};
});

const hasSuggestions = computed(
	() => suggestions.value.suggestions.length > 0
);

const onKeyDownEvent: EventListener = event => {
	if (!(event instanceof KeyboardEvent)) return;
	if (event.defaultPrevented) return;
	onKeyDown(event);
};

function normalizeChatValue(value: string) {
	if (!value.includes('<')) return value;

	const doc = new DOMParser().parseFromString(value, 'text/html');
	doc.querySelectorAll('p').forEach((paragraph, index, paragraphs) => {
		if (index === paragraphs.length - 1) return;
		paragraph.append(doc.createTextNode('\n'));
	});
	doc.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
	const normalizedValue = doc.body.textContent ?? '';
	if (!normalizedValue.trim()) return '';
	return normalizedValue.replace(/\n+$/u, '');
}

function getChatEditorElement() {
	if (!chatInput.value || chatInput.value instanceof HTMLTextAreaElement) {
		return null;
	}

	const editor = chatInput.value.querySelector(
		':scope > .editor-content .ProseMirror, :scope > .editor-content [contenteditable="true"]'
	);
	return editor instanceof HTMLElement ? editor : null;
}

function getChatEditorView() {
	const view = chatInput.value?.__rpgmChatEditor?.view;
	return view?.state ? view : null;
}

function getChatInputPlugin() {
	const view = getChatEditorView();
	if (!view?.state) return null;
	return (
		foundry.prosemirror as unknown as {
			plugins: {
				chat: {
					ChatInputPlugin: {
						key: {
							get: (state: object) => {
								spec?: {
									instance?: {
										setMessage?: (
											view: { state: object },
											message: string,
											meta?: { noHistory: true }
										) => void;
										sendMessage?: (view: { state: object }) => void | Promise<void>;
									};
								};
							};
						};
					};
				};
			};
		}
	).plugins.chat.ChatInputPlugin.key.get(
		view.state
	)?.spec?.instance;
}

function getChatInputValue() {
	if (!chatInput.value) return '';
	const view = getChatEditorView();
	if (view?.state) {
		const prosemirror = globalThis as typeof globalThis & {
			ProseMirror?: {
				dom: {
					serializeString: (content: unknown) => string;
				};
			};
		};
		const content = view.state.doc.content;
		return normalizeChatValue(
			prosemirror.ProseMirror?.dom.serializeString(content) ?? ''
		);
	}
	const editor = getChatEditorElement();
	if (editor) {
		return normalizeChatValue(editor.innerHTML ?? '');
	}
	return normalizeChatValue(chatInput.value.value ?? '');
}

function createChatMarkup(value: string) {
	const container = document.createElement('div');
	const lines = value.split('\n');
	const normalizedLines = lines.length ? lines : [''];

	for (const line of normalizedLines) {
		const paragraph = document.createElement('p');
		if (line) {
			paragraph.textContent = line;
		} else {
			paragraph.append(document.createElement('br'));
		}
		container.append(paragraph);
	}

	return container.innerHTML;
}

function addChatListeners(input: ChatInputElement | null) {
	chatInput.value?.removeEventListener('input', onInput, true);
	chatInput.value?.removeEventListener('keydown', onKeyDownEvent, true);

	chatInput.value = input;
	chatInput.value?.addEventListener('input', onInput, true);
	chatInput.value?.addEventListener('keydown', onKeyDownEvent, true);
	if (chatInput.value) onInput();
	else {
		chatValue.value = '';
		parseResult.value = undefined;
	}
}

function bindChatInput(input = document.querySelector(CHAT_MESSAGE)) {
	addChatListeners(input as ChatInputElement | null);
}

function claimKeyEvent(event: KeyboardEvent, recordPending?: { recordPending: boolean }) {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
	if (recordPending) recordPending.recordPending = false;
}

function resetCompletionState() {
	completionIndex.value = -1;
	completionCursor.value = typedChatValue.value.length;
}

function updateParse(value: string) {
	if (!value.trimStart().startsWith('*')) {
		parseResult.value = undefined;
		return;
	}
	parseResult.value = rpgm.chat.parse(value.trimStart().slice(1));
}

function setChatInputValue(
	value: string,
	options: { focus?: boolean; notify?: boolean; suppressHistory?: boolean } = {}
) {
	if (!chatInput.value) return;
	const view = getChatEditorView();
	const chatInputPlugin = getChatInputPlugin();
	if (view && chatInputPlugin?.setMessage) {
		chatInputPlugin.setMessage(
			view,
			createChatMarkup(value),
			options.suppressHistory ? { noHistory: true } : undefined
		);
		if (options.focus ?? true) chatInput.value.focus();
		if (options.notify) onInput();
		return;
	}
	const editor = getChatEditorElement();
	if (editor) {
		editor.innerHTML = createChatMarkup(value);
		if (options.focus ?? true) chatInput.value.focus();
		if (options.notify) {
			onInput();
		}
		return;
	}
	chatInput.value.value = value;
	if (options.focus ?? true) chatInput.value.focus();
	if (options.notify) {
		chatInput.value.dispatchEvent(new Event('input', { bubbles: true }));
	}
}

function syncTypedValue(value: string) {
	chatValue.value = value;
	typedChatValue.value = value;
	completionCursor.value = value.length;
	updateParse(value);
}

function clearCommandInput() {
	setChatInputValue('', {
		focus: false,
		notify: true,
		suppressHistory: true
	});
	syncTypedValue('');
	resetCompletionState();
}

function getCommandBounds(value: string) {
	const trimmedValue = value.trimStart();
	if (!trimmedValue.startsWith('*')) return null;

	const leadingWhitespaceLength = value.length - trimmedValue.length;
	const commandStart = leadingWhitespaceLength + 1;
	return {
		commandStart,
		commandText: trimmedValue.slice(1)
	};
}

function getExecutableCommand(value: string) {
	const commandBounds = getCommandBounds(value);
	if (!commandBounds) return null;

	return commandBounds.commandText.trimEnd();
}

function suggestionValue(
	completion: (typeof suggestions.value.suggestions)['0'] | undefined,
	force: boolean
) {
	if (!completion) return typedChatValue.value;

	const commandBounds = getCommandBounds(typedChatValue.value);
	if (!commandBounds) return typedChatValue.value;

	const replacementStart =
		commandBounds.commandStart + completion.range.start;
	const replacementEnd =
		commandBounds.commandStart + completion.range.end;

	const nextValue = [
		typedChatValue.value.slice(0, replacementStart),
		completion.text,
		typedChatValue.value.slice(replacementEnd)
	].join('');

	return force && !nextValue.endsWith(' ') ? `${nextValue} ` : nextValue;
}

function executeCurrentCommand() {
	const command = getExecutableCommand(typedChatValue.value);
	if (!command) return false;

	try {
		rpgm.chat.execute(command);
		clearCommandInput();
		return true;
	} catch (error) {
		rpgm.logger.visible.error(
			'An error occured when executing the command!'
		);
		rpgm.logger.error((error as Error).message);
		return true;
	}
}

function sendCurrentMessage() {
	const view = getChatEditorView();
	const chatInputPlugin = getChatInputPlugin();
	if (view && chatInputPlugin?.sendMessage) {
		void chatInputPlugin.sendMessage(view);
		return true;
	}

	return executeCurrentCommand();
}

function previewSuggestion(by: number) {
	if (!hasSuggestions.value) return;
	if (completionIndex.value === -1) {
		completionCursor.value = typedChatValue.value.length;
	}
	moveSuggestionCursor(by);
	setChatInputValue(
		suggestionValue(suggestions.value.suggestions[completionIndex.value], false),
		{ suppressHistory: true }
	);
}

function chooseSuggestion(completion?: (typeof suggestions.value.suggestions)['0']) {
	const value = suggestionValue(completion, true);
	setChatInputValue(value, { notify: true });
	syncTypedValue(value);
	resetCompletionState();
}

function suggestionLabel(completion: (typeof suggestions.value.suggestions)['0']) {
	return completion.tooltip || completion.text;
}

/**
 * For updating the input after pressing enter.
 * @param e - Keyboard event
 */
function handleSuggestionKeydown(
	e: KeyboardEvent,
	recordPending?: { recordPending: boolean }
) {
	switch (e.key) {
		case 'Enter': {
			if (!typedChatValue.value.trimStart().startsWith('*')) return false;
			claimKeyEvent(e, recordPending);
			if (hasSuggestions.value && completionIndex.value >= 0) {
				chooseSuggestion(
					suggestions.value.suggestions[completionIndex.value]
				);
			}
			return sendCurrentMessage();
		}
		case 'ArrowDown': {
			if (!hasSuggestions.value) return false;
			claimKeyEvent(e, recordPending);
			previewSuggestion(1);
			return true;
		}
		case 'ArrowUp': {
			if (!hasSuggestions.value) return false;
			claimKeyEvent(e, recordPending);
			previewSuggestion(-1);
			return true;
		}
		case 'Tab': {
			if (!hasSuggestions.value) return false;
			claimKeyEvent(e, recordPending);
			previewSuggestion(e.shiftKey ? -1 : 1);
			chooseSuggestion(suggestions.value.suggestions[completionIndex.value]);
			return true;
		}
		case 'Escape': {
			if (!hasSuggestions.value && completionIndex.value === -1) return false;
			claimKeyEvent(e, recordPending);
			resetCompletionState();
			setChatInputValue(typedChatValue.value, { suppressHistory: true });
			return true;
		}
		default: {
			return false;
		}
	}
}

function onKeyDown(e: KeyboardEvent) {
	if (handleSuggestionKeydown(e)) return;
	if (e.key.length > 1) onInput();
}

/**
 * @param by - How many to increment the suggestion cursor by
 */
function moveSuggestionCursor(by: number) {
	const suggestionsLength = suggestions.value.suggestions.length;
	// Wraparound so that allowed values are [-1, suggestionsLength)
	completionIndex.value =
		(completionIndex.value + suggestionsLength + 1 + by) %
		(suggestionsLength + 1);
}

/**
 * @param completion - Suggestion to complete
 * @param force - End completion with a space, signalling a definite choice
 */
/**
 * Attempt to execute a message as a command.
 * @param _log - (unused)
 * @param message - The message string to attempt to execute
 * @param _chatData - (unused)
 * @param _chatData.user - (unused)
 * @param _chatData.speaker - (unused)
 * @returns True if the command was executed, else void
 */
function handleMessage(
	_log: ChatLog,
	message: string,
	_chatData: {
		user: string;
		speaker: ReturnType<ChatMessage.ImplementationClass['getSpeaker']>;
	}
): boolean | void {
	const normalizedMessage = normalizeChatValue(message);
	const executableCommand = getExecutableCommand(normalizedMessage);
	if (executableCommand) {
		try {
			rpgm.chat.execute(executableCommand);
		} catch (e) {
			rpgm.logger.visible.error(
				'An error occured when executing the command!'
			);
			rpgm.logger.error((e as Error).message);
		}
		return false;
	}
	// Handle escaping commands
	else if (normalizedMessage.trimStart().startsWith('\\*')) {
		setTimeout(() => {
			game.messages.forEach(message => {
				if (
					!normalizeChatValue(message.content)
						.trimStart()
						.startsWith('\\*')
				)
					return;
				void message.update(
					{ content: message.content.replace('\\*', '*') },
					{}
				);
			});
		}, 100);
	}
}

/** When a character is typed, parse the input. */
function onInput() {
	const value = getChatInputValue();
	syncTypedValue(value);
	resetCompletionState();
}

onMounted(() => {
	bindChatInput();
	chatInputHook.value = Hooks.on(
		'chatInput' as never,
		((event: KeyboardEvent, options: { recordPending: boolean }) => {
			if (!handleSuggestionKeydown(event, options)) return;
			return false;
		}) as never
	);
	renderChatInputHook.value = Hooks.on(
		'renderChatInput' as never,
		((_app: ChatLog, elements: Record<string, HTMLElement>) => {
			bindChatInput(elements[CHAT_MESSAGE]);
		}) as never
	);
	messageHook.value = Hooks.on('chatMessage', handleMessage);
});

onUnmounted(() => {
	Hooks.off('chatMessage', messageHook.value);
	Hooks.off('chatInput' as never, chatInputHook.value);
	Hooks.off('renderChatInput' as never, renderChatInputHook.value);
	chatInput.value?.removeEventListener('input', onInput, true);
	chatInput.value?.removeEventListener('keydown', onKeyDownEvent, true);
});

const commandStyles = computed<StyleValue[]>(() => {
	return suggestions.value.suggestions.map<StyleValue>((_, i) => {
		return {
			...(i == completionIndex.value
				? {
					color: '#00ffae',
					backgroundColor: 'rgb(255 255 255 / 0.08)'
				}
				: {})
		};
	});
});
</script>

<template>
	<div
		id="rpgm-chat-command"
		v-follow="CHAT_MESSAGE"
		style="position: relative"
	>
		<div class="rpgm-chat-commands-container">
			<div :style="statusStyle" class="rpgm-chat-commands-status" />
			<TransitionGroup
				name="rpgm-chat-command"
				reversed
				tag="ul"
				class="rpgm-chat-commands"
			>
				<li
					v-for="(completion, i) in suggestions.suggestions"
					:key="`${completion.text}`"
					:style="commandStyles[i]"
					class="rpgm-chat-command"
					@mousedown.prevent.stop="chooseSuggestion(completion)"
				>
					{{ suggestionLabel(completion) }}
				</li>
			</TransitionGroup>
		</div>
	</div>
</template>

<style>
.rpgm-chat-commands-container {
	padding-bottom: 10px;
	position: absolute;
	bottom: 0;
	width: 100%;
	background: var(--color-cool-5-90);
	border-radius: 6px 6px 3px 3px;
	overflow: hidden;
	/* box-shadow: inset 0 0 8px #000000; */
	transition: all 0.2s ease;
	opacity: 0;
	visibility: hidden;
}

.rpgm-chat-commands {
	list-style: none;
	margin: 0;
	padding: 0;
}

/* Show commands on focus or when clicking the command list */
.rpgm-chat-commands-container:focus-within,
.chat-form:has(#chat-message:focus-within),
#chat-form:has(#chat-message:focus-within),
#chat-notifications:has(#chat-message:focus-within) {
	.rpgm-chat-commands-container:has(.rpgm-chat-command) {
		opacity: 1;
		visibility: visible;
	}
}

.rpgm-chat-commands-status {
	width: 120%;
	height: 120%;
	left: 50%;
	transform: translateX(-50%);
	position: absolute;
	bottom: 0;
	transition: box-shadow 0.2s;
}

.rpgm-chat-command {
	padding: 1px;
	position: relative;
	transition: all 0.25s ease;
	color: white;
	margin: 0;
	padding: 0.25em;
	cursor: pointer;
}

.rpgm-chat-command-enter-from,
.rpgm-chat-command-leave-to {
	opacity: 0;
	max-height: 0;
	left: -10px;
}

.rpgm-chat-command-enter-to,
.rpgm-chat-command-leave-from {
	opacity: 1;
	max-height: 100px;
	left: 0px;
}
</style>
