<script setup lang="ts">
import type { ParseResults } from 'brigadier-ts-lite';
import { Suggestions } from 'brigadier-ts-lite';
import type { StyleValue } from 'vue';

import { vFollow } from './VFollow';

const CHAT_MESSAGE = '#chat-message';

type ChatInputElement = (HTMLTextAreaElement | HTMLElement) & {
	value: string;
	focus: () => void;
};

const messageHook = ref(-1);
const renderChatInputHook = ref(-1);
const chatInput = ref<ChatInputElement | null>(null);
const chatValue = ref('');
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
	onKeyDown(event);
};

function normalizeChatValue(value: string) {
	if (!value.includes('<')) return value;

	const doc = new DOMParser().parseFromString(value, 'text/html');
	doc.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
	return doc.body.textContent ?? '';
}

function getChatInputValue() {
	if (!chatInput.value) return '';
	return normalizeChatValue(chatInput.value.value ?? '');
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

function claimKeyEvent(event: KeyboardEvent) {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
}

function setChatInputValue(value: string, focus: boolean = true) {
	if (!chatInput.value) return;
	chatInput.value.value = value;
	if (focus) chatInput.value.focus();
	chatValue.value = value;
	completionCursor.value = value.length;
	onInput();
}

function applySuggestion(
	completion: (typeof suggestions.value.suggestions)['0'] | undefined,
	force: boolean
) {
	if (!completion) {
		setChatInputValue(chatValue.value);
		return;
	}

	const nextValue = [
		chatValue.value.slice(0, completion.range.start),
		completion.text,
		chatValue.value.slice(completion.range.end)
	].join('');

	setChatInputValue(
		force && !nextValue.endsWith(' ') ? `${nextValue} ` : nextValue
	);
	completionIndex.value = suggestions.value.suggestions.findIndex(
		suggestion => suggestion.text === completion.text
	);
}

function executeCurrentCommand() {
	const command = chatValue.value.trimStart();
	if (!command.startsWith('*')) return false;

	try {
		rpgm.chat.execute(command.slice(1));
		completionIndex.value = -1;
		parseResult.value = undefined;
		setChatInputValue('', false);
		return true;
	} catch (error) {
		rpgm.logger.visible.error(
			'An error occured when executing the command!'
		);
		rpgm.logger.error((error as Error).message);
		return true;
	}
}

function previewSuggestion(by: number) {
	if (!hasSuggestions.value) return;
	if (completionIndex.value === -1) {
		completionCursor.value = chatValue.value.length;
	}
	moveSuggestionCursor(by);
	applySuggestion(suggestions.value.suggestions[completionIndex.value], false);
}

function chooseSuggestion(completion?: (typeof suggestions.value.suggestions)['0']) {
	applySuggestion(completion, true);
}

function suggestionLabel(completion: (typeof suggestions.value.suggestions)['0']) {
	return completion.tooltip || completion.text;
}

/**
 * For updating the input after pressing enter.
 * @param e - Keyboard event
 */
function onKeyDown(e: KeyboardEvent) {
	switch (e.key) {
		case 'Enter': {
			if (!chatValue.value.trimStart().startsWith('*')) break;
			claimKeyEvent(e);
			if (hasSuggestions.value) {
				if (completionIndex.value === -1) previewSuggestion(1);
				else chooseSuggestion(
					suggestions.value.suggestions[completionIndex.value]
				);
			}
			executeCurrentCommand();
			break;
		}
		case 'ArrowDown': {
			if (!hasSuggestions.value) break;
			claimKeyEvent(e);
			previewSuggestion(1);
			break;
		}
		case 'ArrowUp': {
			if (!hasSuggestions.value) break;
			claimKeyEvent(e);
			previewSuggestion(-1);
			break;
		}
		case 'Tab': {
			if (!hasSuggestions.value) break;
			claimKeyEvent(e);
			previewSuggestion(e.shiftKey ? -1 : 1);
			chooseSuggestion(suggestions.value.suggestions[completionIndex.value]);
			break;
		}
		case 'Escape': {
			if (!hasSuggestions.value && completionIndex.value === -1) break;
			claimKeyEvent(e);
			completionIndex.value = -1;
			setChatInputValue(chatValue.value);
			break;
		}
		case 'Shift': {
			break;
		}
		default: {
			if (e.key.length > 1) {
				onInput();
			}
		}
	}
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
	if (normalizedMessage.trimStart().startsWith('*')) {
		chatValue.value = '';
		parseResult.value = undefined;
		setTimeout(() => {
			onInput();
		}, 10);
		try {
			rpgm.chat.execute(normalizedMessage.trimStart().slice(1));
			completionIndex.value = -1;
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
	completionIndex.value = -1;
	chatValue.value = getChatInputValue();
	completionCursor.value = chatValue.value.length;
	if (!chatValue.value.trimStart().startsWith('*'))
		parseResult.value = undefined;
	else
		parseResult.value = rpgm.chat.parse(
			chatValue.value
				.trimStart()
				.slice(
					1,
					completionCursor.value >= 0
						? completionCursor.value
						: undefined
				)
		);
}

onMounted(() => {
	bindChatInput();
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
	Hooks.off('renderChatInput' as never, renderChatInputHook.value);
	chatInput.value?.removeEventListener('input', onInput, true);
	chatInput.value?.removeEventListener('keydown', onKeyDownEvent, true);
});

const commandStyles = computed<StyleValue[]>(() => {
	return suggestions.value.suggestions.map<StyleValue>((_, i) => {
		return {
			...(i == completionIndex.value ? { color: '#00ffae' } : {})
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
