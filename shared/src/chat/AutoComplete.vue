<script setup lang="ts">
import type { ParseResults } from 'brigadier-ts-lite';
import { Suggestions } from 'brigadier-ts-lite';
import type { Directive, StyleValue } from 'vue';

const MAX_AUTO_COMPLETE = 7;
const CHAT_MESSAGE = '#chat-message';

const chatInput = ref<HTMLTextAreaElement | null>();
const chatValue = ref("");
const isOpen = computed(() => {
	return hasFocus.value
		&& chatValue.value.length > 0;
});
const hasFocus = ref(false);

const observer = ref<MutationObserver | null>();
const targetParent = ref<HTMLElement | null>();

const Statuses = {
	okay: "#00ffae",
	warn: "#ffae00",
	empty: "#00000000"
};

const parseResult = ref<ParseResults>();

const status = computed(() => {
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

const suggestions = computed<Suggestions>(() => {
	if (!parseResult.value) return Suggestions.EMPTY;
	return rpgm.chat.getCompletionSuggestions(parseResult.value);
});

/** For updating the input after pressing enter */
function onKeyPress(e: KeyboardEvent) {
	if (e.key === "Enter") {
		chatValue.value = "";
	}
}

function onInput(_: Event) {
	hasFocus.value = true;
	if (chatInput.value?.value === undefined) return;
	chatValue.value = chatInput.value.value;
	if (!chatValue.value.startsWith('*')) parseResult.value = undefined;
	else parseResult.value = rpgm.chat.parse(chatValue.value.slice(1));
}

const vFollow: Directive<HTMLElement & { _observer: MutationObserver }, string> = {
	mounted: (el, { value: targetSelector }) => {
		const target = document.querySelector(targetSelector);
		if (!target) return;
		const observer = new MutationObserver(() => {
			const newParent = target.parentElement;
			if (newParent !== el.parentElement) {
				newParent?.insertBefore(el, target);
			}
		});
		const interfaceEl = document.querySelector("#interface");
		if (!interfaceEl) return;
		observer.observe(interfaceEl, { childList: true, subtree: true });
		el._observer = observer;
	},
	unmounted: (el) => {
		el._observer.disconnect();
	}
};

onMounted(() => {
	chatInput.value = document.querySelector("#chat-message") as HTMLTextAreaElement;
	chatInput.value?.addEventListener("input", onInput);
	chatInput.value?.addEventListener("keydown", onKeyPress);
	chatInput.value?.addEventListener("focusin", () => hasFocus.value = true);
	chatInput.value?.addEventListener("focusout", () => hasFocus.value = false);

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
});

onUnmounted(() => {
	chatInput.value?.removeEventListener("input", onInput);
	chatInput.value?.removeEventListener("keydown", onKeyPress);
	chatInput.value?.removeEventListener("focusin", () => hasFocus.value = true);
	chatInput.value?.removeEventListener("focusout", () => hasFocus.value = false);
	observer.value?.disconnect();
});
</script>

<template>
	<div v-follow="CHAT_MESSAGE" style="position: relative">
		<div :open="isOpen" class="rpgm-chat-commands-container">
			<div :style="statusStyle" class="rpgm-chat-commands-status" />
			<TransitionGroup name="rpgm-chat-command" tag="ul" class="rpgm-chat-commands">
				<li v-for="command in suggestions.suggestions.slice(0, MAX_AUTO_COMPLETE)" :key="`${command.text}`"
					class="rpgm-chat-command">
					{{ command.tooltip }}
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

.rpgm-chat-commands-container[open="true"]:has(.rpgm-chat-command) {
	opacity: 1;
	visibility: visible;
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
}

.rpgm-chat-command:focus,
.rpgm-chat-commands:not(:focus-within)>.rpgm-chat-command:first-child {
	color: mediumspringgreen;
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
