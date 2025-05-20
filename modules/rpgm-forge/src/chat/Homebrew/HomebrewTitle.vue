<script setup lang="ts">
import WriteOnTransition from "#/util/WriteOnTransition.vue";
import ContentEditable from "#/util/ContentEditable.vue";

const data = inject<ForgeChatHomebrew>("data")!;

const currentTitle = defineModel<string>({ required: true });

defineProps<{
	editing: boolean
	canGotoGenerations: boolean
}>();

const emit = defineEmits<{
	cycle: [by: number]
	click: [event: MouseEvent]
	gotoGenerations: []
}>();

const editingTitle = ref(false);

const rename = (n: string) => {
	if (n.trim().length == 0) return;
	if (data.schema)
		data.schema.name = n;
};
</script>

<template>
	<div class="rpgm-homebrew-title-container" :editing @click="emit('click', $event)">
		<ContentEditable v-slot="config" v-model:editing="editingTitle" :model-value="currentTitle" :multiline="false"
			@update:model-value="rename">
			<WriteOnTransition :enabled="!editingTitle" :duration="400">
				<h1 :key="currentTitle" :ref="config.ref" :contenteditable="config.contenteditable"
					class="rpgm-homebrew-title rpgm-radial-ignore" @keydown="config.onKeydown" @blur="config.onBlur">
					{{ currentTitle }}
				</h1>
			</WriteOnTransition>
		</ContentEditable>
		<div v-show="!editing && currentTitle.length > 0" class="rpgm-icons">
			<a v-show="Object.keys(data.generations).length > 1" title="Previous generation"
				@click.stop="emit('cycle', -1)"><i class="fa-solid fa-circle-left" /></a>
			<a v-show="Object.keys(data.generations).length > 1" title="Next generation" style="margin-left: auto;"
				@click.stop="emit('cycle', 1)"><i class="fa-solid fa-circle-right" /></a>
		</div>
		<div v-show="editing && currentTitle.length > 0" class="rpgm-icons">
			<a v-if="!editingTitle" title="Edit Type" @click.stop="editingTitle = true"><i class="fa-solid fa-feather" /></a>
			<a v-if="canGotoGenerations" style="margin-left: auto;" title="View all generations"
				@click.stop="emit('gotoGenerations')"><i class="fa-solid fa-cubes-stacked" /></a>
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
	margin-top: 2px;
	margin-bottom: 0px;
	padding-left: 20px;
	padding-right: 20px;
	outline: none;
	transition: color 0.5s;
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
