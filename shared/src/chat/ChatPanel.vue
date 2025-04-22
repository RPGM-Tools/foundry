<script setup lang="ts">
import { computed, type Directive, onMounted, onUnmounted, ref, type StyleValue } from 'vue'

const MAX_AUTO_COMPLETE = 7
const CHAT_MESSAGE = '#chat-message'

const chatInput = ref<HTMLTextAreaElement | null>()
const chatValue = ref("")
const isOpen = computed(() => {
	return hasFocus.value
		&& chatValue.value.length > 0
})
const hasFocus = ref(false)

const observer = ref<MutationObserver | null>()
const targetParent = ref<HTMLElement | null>()

const Statuses = {
	okay: "#00ffae",
	warn: "#ffae00",
	empty: "#00000000"
}

const status = computed(() => {
	if (filteredCommands.value.length === 1) return Statuses.okay
	return Statuses.warn
})

const statusStyle = computed<StyleValue>(() => {
	return {
		boxShadow: `inset 0px -4px 10px ${status.value}`
	}
})

const filteredCommands = computed<ChatCommand[]>(() => {
	if (chatValue.value === "") return []
	return rpgm.chatCommands.commands.filter(command => (rpgm.chatCommands.COMMAND_PREFIX + command.name).startsWith(chatValue.value)).slice(0, MAX_AUTO_COMPLETE)
})

onMounted(() => {
	chatInput.value = document.querySelector("#chat-message") as HTMLTextAreaElement | null
	chatInput.value?.addEventListener("keyup", onKeyPress)
	chatInput.value?.addEventListener("focusin", () => hasFocus.value = true)
	chatInput.value?.addEventListener("focusout", () => hasFocus.value = false)

	observer.value = new MutationObserver(() => {
		const newParent = chatInput.value?.parentElement
		if (targetParent.value !== newParent) {
			targetParent.value = newParent
		}
	})

	if (chatInput.value) {
		observer.value.observe(document.body, {
			childList: true,
			subtree: true
		})
	}
})

onUnmounted(() => {
	chatInput.value?.removeEventListener("keyup", onKeyPress)
	chatInput.value?.removeEventListener("focusin", () => hasFocus.value = true)
	chatInput.value?.removeEventListener("focusout", () => hasFocus.value = false)
	observer.value?.disconnect()
})

function onKeyPress(_: KeyboardEvent) {
	if (chatInput.value?.value === undefined) return
	chatValue.value = chatInput.value.value
}

const vFollow: Directive<HTMLElement, string> = {
	mounted: (el, { value: targetSelector }) => {
		const target = document.querySelector(targetSelector)
		if (!target) return
		const observer = new MutationObserver(() => {
			const newParent = target.parentElement
			if (newParent !== el.parentElement) {
				newParent?.insertBefore(el, target)
			}
		})
		const interfaceEl = document.querySelector("#interface")
		if (!interfaceEl) return
		observer.observe(interfaceEl, { childList: true, subtree: true })
		Object.assign(el, { _observer: observer })
	},
	unmounted: (el) => {
		(el as any)._observer.disconnect
	}
}
</script>

<template>
	<div v-follow="CHAT_MESSAGE" style="position: relative">
		<div :open="isOpen" class="rpgm-chat-commands-container">
			<div :style="statusStyle" class="rpgm-chat-commands-status" />
			<TransitionGroup name="rpgm-chat-command" tag="ul" class="rpgm-chat-commands">
				<li v-for="command in filteredCommands" :key="command.name" class="rpgm-chat-command">
					{{ command.name }}
				</li>
			</TransitionGroup>
		</div>
	</div>
</template>

<style scoped>
.rpgm-chat-commands-container {
	padding-bottom: 10px;
	position: absolute;
	bottom: 0;
	width: 100%;
	background: #000000dd;
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
	margin: 1px;
	padding: 1px;
	position: relative;
	transition: all 0.25s ease;
}

.rpgm-chat-command:only-child {
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
