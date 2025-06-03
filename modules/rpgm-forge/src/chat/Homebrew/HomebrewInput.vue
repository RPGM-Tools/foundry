<script setup lang="ts">
import HomebrewInputField from './HomebrewInputField.vue';

const emit = defineEmits<{ generate: [] }>();

const fieldsContainer = useTemplateRef("fieldsContainer");

const data = inject<ForgeChatHomebrew>("data")!;

const { loading } = defineProps<{ loading: boolean }>();

const renaming = ref(false);
/** Disable css for 10ms when renaming a field */
function pauseTransition() {
	renaming.value = true;
	setTimeout(() => renaming.value = false, 10);
}

/** Appends a field to the current schema */
function newField() {
	data.options.schema?.fields.push({
		name: "[Name]",
		description: "[Description]",
		type: "short",
	});
	// Gross scroll down hack
	setTimeout(() => {
		fieldsContainer.value?.parentElement?.parentElement?.scrollBy({ top: 9999, behavior: "smooth" });
	}, 100);
}

/** 
 * @param i - the index of this field
 * @returns -1 if first, 1 if last, 0 otherwise
 */
function buttonIndex(i: number): -1 | 0 | 1 {
	return i <= 0 ? -1 : i >= data.options.schema!.fields.length - 1 ? 1 : 0;
}
</script>

<template>
	<div ref="fieldsContainer" class="rpgm-homebrew-fields-container">
		<template v-if="data.options.schema?.fields.length">
			<TransitionGroup :css="!renaming" name="rpgm-homebrew-field-container">
				<HomebrewInputField v-for="(field, i) in data.options.schema.fields" :key="field.name" :model-value="field"
					:i="buttonIndex(i)" @renaming="pauseTransition" />
			</TransitionGroup>
			<div class="rpgm-homebrew-field-add rpgm-icons">
				<a @click="newField">
					<i class="fa-solid fa-plus" />
				</a>
			</div>
			<button class="rpgm-button" :class="{ 'rpgm-active': loading }"
				:disabled="(data.options.schema.fields.length ?? 0) == 0 || loading" @click="emit('generate')">Generate</button>
		</template>
		<p v-else>
			<i>Add some fields to get started</i>
		</p>
	</div>
</template>

<style>
.rpgm-homebrew-fields-container {
	padding: 5px;

	>*:not(:first-child) {
		margin-top: 8px;
	}
}

.rpgm-homebrew-field-container-move {
	transition-duration: 0.2s !important;
}

.rpgm-homebrew-field-container-enter-from {
	opacity: 0;
	max-height: 0px;
	left: -10px;
}

.rpgm-homebrew-field-container-leave-to {
	opacity: 0;
	left: 10px;
}

.rpgm-homebrew-field-add.rpgm-icons {
	position: relative;
	opacity: 1;
	filter: blur(0px);
	visibility: visible;
	pointer-events: all;
	border-radius: 6px;
	cursor: pointer;

	a {
		display: flex;
		justify-content: center;
		width: 100%;
	}
}

.rpgm-homebrew-field-container-enter-to {
	opacity: 1;
	max-height: 500px;
	left: 0px;
}

.rpgm-homebrew-field-container-leave-active {
	position: absolute;
}

.rpgm-homebrew-field-container-leave-from {
	left: 0px;
	opacity: 1;
}
</style>
