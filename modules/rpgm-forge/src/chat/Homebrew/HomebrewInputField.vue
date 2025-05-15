<script setup lang="ts">
import ContentEditable from "#/util/ContentEditable.vue";

const data = inject<ForgeChatHomebrew>("data")!;

const { i } = defineProps<{ i: -1 | 0 | 1 }>();

const field = defineModel<HomebrewField>({ required: true });

const emit = defineEmits<{
	renaming: []
}>();

const localize = rpgm.localize;
const editing = ref(false);
const fieldContainer = useTemplateRef("fieldContainer");

/**
 * Checks to see if a field can be renamed to {@link n} 
 * @param n - The name to validate
 */
function validateNewName(n: string) {
	rpgm.logger.log(`"${n}"`);
	const valid = (() => {
		if (n === field.value.name) return false;
		if (n.trim().length == 0) {
			rpgm.forge!.logger.errorU("Homebrew field cannot be empty!");
			return false;
		}
		for (const f of data.schema!.fields) {
			if (f === field.value) continue;
			if (f.name.slugify({ strict: true, replacement: "_" })
				=== n.slugify({ strict: true, replacement: "_" })) {
				rpgm.forge!.logger.errorU(`"${f.name}" already exists!`);
				return false;
			}
		}
		return true;
	})();
	if (valid) {
		field.value.name = n.trim();
		emit("renaming");
	}
}

/** Deletes this field from the schema */
function remove() {
	data.schema!.fields.splice(data.schema!.fields.indexOf(field.value), 1);
}

/** 
 * Reorders this field in the schema 
 * @param by - How many fields to move forwards or backwards
 */
function move(by: number) {
	const idx = data.schema!.fields.indexOf(field.value);
	const clippedIdx = Math.max(0, Math.min(data.schema!.fields.length - 1, idx + by));
	if (clippedIdx === idx) return;

	data.schema!.fields.splice(idx, 1);
	data.schema!.fields.splice(clippedIdx, 0, field.value);
}

/**
 * Ignore focus changes within the field, else disable editing mode
 * @param e - The {@link FocusEvent} to detect the target of blur
 */
function tryBlur(e: FocusEvent) {
	if (fieldContainer.value?.contains(e.relatedTarget as HTMLElement)) return;
	window.getSelection()?.removeAllRanges();
	editing.value = false;
}
</script>

<template>
	<div ref="fieldContainer" :key="field.name" class="rpgm-homebrew-field-container" :editing="editing"
		@keydown.escape.prevent="editing = false" @focusout="tryBlur">
		<div class="rpgm-icons">
			<a placeholder="Remove" @click="remove"><i class="fa-solid fa-trash" /></a>
			<a @click="editing = !editing"><i class="fa-solid fa-feather" /></a>
			<a v-if="i != -1" @click="move(-1)"><i class="fa-solid fa-circle-up" /></a>
			<a v-if="i != 1" @click="move(1)"><i class="fa-solid fa-circle-down" /></a>
		</div>
		<ContentEditable v-slot="{ contenteditable, onBlur, onFocus, onKeydown, ref }" v-model:editing="editing"
			:model-value="field.name" :should-blur="false" :multiline="false" @update:model-value="validateNewName">
			<h3 :ref class="rpgm-homebrew-field-name rpgm-radial-ignore" :contenteditable @blur="onBlur" @focus="onFocus"
				@keydown="onKeydown">
				{{ field.name }}
			</h3>
		</ContentEditable>
		<ContentEditable v-slot="{ contenteditable, onBlur, onFocus, onKeydown, ref }" v-model:editing="editing"
			v-model="field.description" :should-blur="false" :should-focus="false">
			<div v-show="editing || field.description.length > 0" :ref :contenteditable
				class="rpgm-homebrew-field-description rpgm-radial-ignore" @blur="onBlur" @focus="onFocus" @keydown="onKeydown">
				{{ field.description }}
			</div>
		</ContentEditable>
		<input v-model="field.value" class="rpgm-homebrew-field-value rpgm-input rpgm-radial-ignore"
			:placeholder="localize('RPGM_FORGE.HOMEBREW.PLACEHOLDER')">
	</div>
</template>

<style>
.rpgm-homebrew-field-container {
	position: relative;
	padding-top: 6px;
	padding-top: 6px;
	padding-left: 3px;
	padding-right: 3px;
	transition: all 0.2s ease;
	border-radius: 6px;
}

.rpgm-homebrew-field-name {
	font-style: normal;
	font-size: 15px;
	border-bottom: 1px solid black;
}

.rpgm-homebrew-field-container[editing="true"] {
	backdrop-filter: brightness(0.75);
}

.rpgm-homebrew-field-container[editing="true"] [contenteditable="true"] {
	font-style: italic;
	outline: none;
}

.rpgm-homebrew-field-value {
	margin-bottom: 3px;
}

.rpgm-homebrew-field-description {
	font-style: italic;
}

.rpgm-homebrew-field-value:focus::placeholder {
	opacity: 1;
}

.rpgm-homebrew-field-value::placeholder {
	opacity: 0;
}

.rpgm-homebrew-field-container h3 {
	margin: 2px;
}

.rpgm-homebrew-field-container .rpgm-icons {
	direction: rtl;
	right: 0;
	margin-right: 4px;
}

.rpgm-homebrew-field-icons {
	right: 0;
	opacity: 0;
	visibility: hidden;
}

/* o_O 
Hide icons if...
- Not hovered
- Element is moving
- Name input is focused
- Editing field
*/
.rpgm-homebrew-field-container[editing="false"]:hover:not(.rpgm-homebrew-field-container-move):not(:has(.rpgm-homebrew-field-name:focus)) .rpgm-icons {
	opacity: 1;
	filter: blur(0px);
	visibility: visible;
}
</style>
