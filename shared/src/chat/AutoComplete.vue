<script setup lang="ts">
import type { ParseResults } from 'brigadier-ts-lite';
import { Suggestions } from 'brigadier-ts-lite';
import type { StyleValue } from 'vue';
import { vFollow } from './VFollow';

const CHAT_MESSAGE = '#chat-message';

const messageHook = ref(-1);
const chatInput = ref<HTMLTextAreaElement>();
const chatValue = ref("");
const observer = ref<MutationObserver | null>();
const targetParent = ref<HTMLElement | null>();
const parseResult = ref<ParseResults>();
const completionIndex = ref(-1);
const completionCursor = ref(-1);

const Statuses = {
	okay: "#00ffae",
	warn: "#ffae00",
};

const suggestions = computed<Suggestions>(() => {
	if (!parseResult.value) return Suggestions.EMPTY;
	const completions = rpgm.chat.getCompletionSuggestions(parseResult.value);
	// completions.suggestions.sort((a, b) => a.tooltip.localeCompare(b.tooltip)).reverse();
	return completions;
});

const status = computed(() => {
	if (completionIndex.value >= 0 && completionIndex.value < suggestions.value.suggestions.length) return Statuses.okay;
	const errors = parseResult.value?.errors;
	if (errors && errors.size > 0)
		return Statuses.warn;
	return Statuses.okay;
});

const statusStyle = computed<StyleValue>(() => {
	return {
		boxShadow: `inset 0px -4px 10px ${status.value}`
	};
});

/**
 * For updating the input after pressing enter
 * @param e - Keyboard event
 */
function onKeyDown(e: KeyboardEvent) {
	switch (e.key) {
		case "Enter": {
			break;
		} case "Tab": {
			e.preventDefault();
			// About to start completing, save the original cursor position
			if (completionIndex.value == -1) {
				completionCursor.value = chatValue.value.length;
			}
			const direction = e.shiftKey ? -1 : 1;
			const suggestionsLength = suggestions.value.suggestions.length ?? -1;
			if (suggestionsLength == 0) break;
			moveSuggestionCursor(direction);
			fillInSuggestion(suggestions.value.suggestions[completionIndex.value], false);
			break;
		} case "Shift": {
			break;
		} default: {
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
	completionIndex.value = (completionIndex.value + suggestionsLength + 1 + by) % (suggestionsLength + 1);
}

/**
 * @param completion - Suggestion to complete
 * @param force - End completion with a space, signalling a definite choice
 */
function fillInSuggestion(completion: typeof suggestions.value.suggestions['0'] | undefined, force: boolean) {
	if (!completion) {
		chatInput.value!.value = chatValue.value;
	}
	else {
		// Set input textarea (not actual value) to chatValue[0, completionCursor] + suggestion
		chatInput.value!.value = `${chatValue.value.slice(0, completionCursor.value)}${completion?.tooltip.slice(completion.range.end - completion.range.start)}`;
		// Focus input again in case suggestion was clicked
		if (force) {
			chatInput.value?.focus();
			onInput();
		}
	}
}

/**
 * Attempt to execute a message as a command
 * @param _log - (unused)
 * @param message - The message string to attempt to execute
 * @param _chatData - (unused)
 * @param _chatData.user - (unused)
 * @param _chatData.speaker - (unused)
 * @returns True if the command was executed, else void
 */
function handleMessage(log: ChatLog, message: string, _chatData: { user: string, speaker: ReturnType<ChatMessage.ImplementationClass["getSpeaker"]> }): boolean | void {
	if (message.trimStart().startsWith('*')) {
		chatValue.value = "";
		setTimeout(() => {
			onInput();
		}, 10)
		try {
			rpgm.chat.execute(message.slice(1));
		} catch {
			rpgm.logger.visible.error("An error occured when executing the command!");
		}
		return false;
	}
	// Handle escaping commands
	else if (message.startsWith('\\*')) {
		setTimeout(() => {
			log.collection.forEach(message => {
				if (message.content.startsWith('\\*'))
					// @ts-expect-error This is fine
					message.update({ content: message.content.slice(1) }, {});
			});
		}, 100);
	}
}

/** When a character is typed, parse the input */
function onInput() {
	completionIndex.value = -1;
	if (chatInput.value?.value === undefined) return;
	chatValue.value = chatInput.value.value;
	completionCursor.value = chatValue.value.length;
	if (!chatValue.value.trimStart().startsWith('*')) parseResult.value = undefined;
	else parseResult.value = rpgm.chat.parse(chatValue.value.trimStart().slice(1, completionCursor.value >= 0 ? completionCursor.value : undefined));
}

onMounted(() => {
	chatInput.value = document.querySelector("#chat-message") as HTMLTextAreaElement;
	chatInput.value?.addEventListener("input", onInput, true);
	chatInput.value?.addEventListener("keydown", onKeyDown);

	observer.value = new MutationObserver(() => {
		const newParent = chatInput.value?.parentElement;
		if (targetParent.value !== newParent) {
			targetParent.value = newParent;
		}
	});

	if (chatInput.value) {
		observer.value.observe(document.body, {
			childList: true,
			subtree: true
		});
	}

	messageHook.value = Hooks.on("chatMessage", handleMessage);
});

onUnmounted(() => Hooks.off("chatMessage", messageHook.value));

const commandStyles = computed<StyleValue[]>(() => {
	return suggestions.value.suggestions.map<StyleValue>((_, i) => {
		return {
			...i == completionIndex.value ? { "color": "#00ffae" } : {},
		};
	});
});

onUnmounted(() => {
	chatInput.value?.removeEventListener("input", onInput);
	chatInput.value?.removeEventListener("keydown", onKeyDown);
	observer.value?.disconnect();
});
</script>

<template>
	<div v-follow="CHAT_MESSAGE" style="position: relative">
		<div class="rpgm-chat-commands-container">
			<div :style="statusStyle" class="rpgm-chat-commands-status" />
			<TransitionGroup name="rpgm-chat-command" reversed tag="ul" class="rpgm-chat-commands">
				<li v-for="(completion, i) in suggestions.suggestions" :key="`${completion.text}`" :style="commandStyles[i]"
					class="rpgm-chat-command" @click="fillInSuggestion(completion, true)">
					{{ completion.tooltip }}
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
#chat-form:has(#chat-message:focus) {
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
