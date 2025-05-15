<script setup lang="ts">
import WriteOnTransition from "#/util/WriteOnTransition.vue";

const data = inject<ForgeChatHomebrew>("data")!;
const titleRef = useTemplateRef("title");
const isSecure = ref(window.isSecureContext);

const { currentTitle } = defineProps<{
	currentTitle: string
	editing: boolean
	canGotoGenerations: boolean
	modified?: boolean
}>();

const emit = defineEmits<{
	cycle: [by: number]
	click: [event: MouseEvent]
	delete: []
	copy: []
	gotoGenerations: []
}>();

const editingTitle = ref(false);

function tryDelete(e: MouseEvent) {
	if (!e.shiftKey) return;
	emit("delete");
}

function startEditTitle() {
	editingTitle.value = true;
	void nextTick(() => {
		if (!titleRef.value) return;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		titleRef.value.focus();
		const range = document.createRange();
		range.selectNodeContents(titleRef.value);
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);
	});
}

function blur() {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	data.schema!.name = titleRef.value!.innerText!;
	void nextTick(() => {
		editingTitle.value = false;
		window.getSelection()?.removeAllRanges();
	});
}
</script>

<template>
	<div class="rpgm-homebrew-title-container" @click="emit('click', $event)" :editing>
		<WriteOnTransition :enabled="!editingTitle" :duration="400">
			<h1 :key="currentTitle" :title="!editing ? 'Click to edit' : ''" :contenteditable="editingTitle"
				@keydown.enter.prevent="blur" @blur="blur" ref="title" v-if="currentTitle" :modified
				class="rpgm-homebrew-title rpgm-radial-ignore">
				{{ currentTitle }}
			</h1>
		</WriteOnTransition>
		<div v-show="!editing && currentTitle.length > 0" class="rpgm-icons">
			<a @click.stop="emit('cycle', -1)" v-show="Object.keys(data.generations).length > 1"
				title="Previous generation"><i class="fa-solid fa-circle-left" /></a>
			<a @click.stop="emit('copy')" style="margin-right: auto;" v-if="isSecure" title="Copy to clipboard"><i
					class="fa-solid fa-copy" /></a>
			<a @click.stop="tryDelete" class="trash-hide" :title="'Delete generation\n(Hold shift)'"><i
					class="fa-solid fa-trash" /></a>
			<a @click.stop="emit('cycle', 1)" v-show="Object.keys(data.generations).length > 1" title="Next generation"><i
					class="fa-solid fa-circle-right" /></a>
		</div>
		<div v-show="editing && currentTitle.length > 0" class="rpgm-icons">
			<a @click.stop="startEditTitle" title="Edit Type"><i class="fa-solid fa-feather" /></a>
			<a @click.stop="emit('gotoGenerations')" v-if="canGotoGenerations" style="margin-left: auto;"
				title="View all generations"><i class="fa-solid fa-cubes-stacked" /></a>
		</div>
	</div>
</template>

<style>
.rpgm-homebrew-title-container {
	position: relative;
	border-radius: 6px;
	padding-bottom: 4px;
	padding-top: 1px;
	padding-left: 4px;
	padding-right: 4px;
	transition: all 0.2s ease;
}

.rpgm-homebrew-title-container[editing="false"]:hover:not(:has(.rpgm-icons:hover)) {
	cursor: pointer;
	backdrop-filter: brightness(0.75);
}

.rpgm-homebrew-title-container:hover {
	.rpgm-icons {
		opacity: 1;
		visibility: visible;
		filter: blur(0px);
	}
}

.rpgm-homebrew-title {
	font-size: 20px;
	text-align: center;
	font-weight: bolder;
	margin-top: 8px;
	margin-bottom: 0px;
	padding-left: 20px;
	padding-right: 20px;
	outline: none;
	transition: color 0.5s;
}

.rpgm-homebrew-title[modified="true"] {
	color: #444;
}

#chat-log:not([data-modifier-shift]) .trash-hide {
	cursor: unset;
	opacity: 50%;
	text-shadow: none !important;
}

.rpgm-homebrew-title-container .rpgm-icons {
	padding-left: 2px;
	padding-right: 2px;
	top: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	transform: translateX(-50%);
	left: 50%;

	/* Clickable area of icons is as tall as the title */
	a {
		position: relative;
		height: 100%;

		* {
			position: relative;
			top: 50%;
			transform: translateY(-50%);
		}
	}
}
</style>
