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
 * Only allow numbers
 * @param e - Keyboard event
 */
function filterNumbers(e: KeyboardEvent) {
	if (e.key.length > 1 || e.metaKey) return;
	if (!isNaN(Number(e.key)) || e.key === ".") return;
	e.preventDefault();
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

/**
 * Change type
 * @param type - New type
 */
function changeType(type: "short" | "long" | "boolean" | "number") {
	field.value.value = undefined;
	field.value.type = type;
}
</script>

<template>
	<div ref="fieldContainer" :key="field.name" class="rpgm-homebrew-field-container" :editing="editing"
		@keydown.escape.prevent="editing = false" @focusout="tryBlur">
		<div class="rpgm-icons">
			<template v-if="!editing">
				<a title="Remove" @click="remove"><i class="fa-solid fa-trash" /></a>
				<a title="Edit" @click="editing = !editing"><i class="fa-solid fa-feather" /></a>
				<a v-if="i != -1" title="Move Up" @click="move(-1)"><i class="fa-solid fa-circle-up" /></a>
				<a v-if="i != 1" title="Move Down" @click="move(1)"><i class="fa-solid fa-circle-down" /></a>
			</template>
			<a v-if="editing" title="Save"><i class="fa-solid fa-save" /></a>
		</div>
		<ContentEditable v-slot="{ contenteditable, onBlur, onFocus, onKeydown, ref }" v-model:editing="editing"
			:model-value="field.name" :should-blur="false" :multiline="false" @update:model-value="validateNewName">
			<h3 :ref class="rpgm-homebrew-field-name rpgm-radial-ignore" :contenteditable :tabindex="contenteditable ? 0 : -1"
				@blur="onBlur" @focus="onFocus" @keydown="onKeydown">
				{{ field.name }}
			</h3>
		</ContentEditable>
		<ContentEditable v-slot="{ contenteditable, onBlur, onFocus, onKeydown, ref }" v-model:editing="editing"
			v-model="field.description" :should-blur="false" :should-focus="false">
			<div v-show="editing || field.description.length > 0" :ref :contenteditable :tabindex="contenteditable ? 0 : -1"
				class="rpgm-homebrew-field-description rpgm-radial-ignore" @blur="onBlur" @focus="onFocus" @keydown="onKeydown">
				{{ field.description }}
			</div>
		</ContentEditable>
		<ul v-show="editing" class="rpgm-homebrew-field-types">
			<li v-for="type in [
				{ label: 'Short', value: 'short' as const, icon: 'fa-solid fa-grip-lines' },
				{ label: 'Long', value: 'long' as const, icon: 'fa-solid fa-align-left' },
				{ label: 'Check', value: 'boolean' as const, icon: 'fa-solid fa-square-check' },
				{ label: 'Number', value: 'number' as const, icon: 'fa-solid fa-hashtag' },
			]" :key="type.value" tabindex="0" :class="{ selected: field.type === type.value }" @click="changeType(type.value)"
				@keydown.space.enter.prevent="changeType(type.value)">
				<i :class="type.icon" />{{ type.label }}
			</li>
		</ul>
		<Transition v-show="!editing" name="rpgm-homebrew-field-container">
			<textarea v-if="field.type === 'long'" v-model="field.value" class="rpgm-radial-ignore rpgm-textarea" />
			<input v-else-if="field.type === 'boolean'" v-model="field.value" class="rpgm-checkbox" type="checkbox">
			<input v-else-if="field.type === 'number'" v-model="field.value"
				class="rpgm-input rpgm-homebrew-field-value rpgm-radial-ignore" type="number"
				:placeholder="`# ${localize('RPGM_FORGE.HOMEBREW.PLACEHOLDER')}`" @keydown="filterNumbers">
			<input v-else v-model="field.value" class="rpgm-homebrew-field-value rpgm-input rpgm-radial-ignore" type="text"
				:placeholder="localize('RPGM_FORGE.HOMEBREW.PLACEHOLDER')">
		</Transition>
	</div>
</template>

<style>
.rpgm-homebrew-field-types {
	list-style: none;
	width: 100%;
	display: flex;
	justify-content: space-evenly;
	border-radius: 3px;
	flex-wrap: nowrap;
	margin: 0;
	padding: 2px;

	li {
		transition: all 200ms;
		width: 100%;
		text-align: center;
		cursor: pointer;
		white-space: nowrap;
		border-radius: 3px;
		padding: 2px;
		outline: none;

		i {
			margin-right: 2px;
		}
	}

	li.selected {
		text-shadow: 0 0 8px #6633cc !important;
	}

	li:focus,
	li:hover {
		background-color: #00000044;
	}
}

.rpgm-homebrew-field-container {
	position: relative;
	padding-bottom: 6px;
	padding-top: 6px;
	transition: all 0.2s ease;
	border-radius: 6px;
}

.rpgm-homebrew-field-container:not(:first-child) {
	margin-top: 6px;
}

.rpgm-homebrew-field-name {
	font-style: normal;
	font-size: 15px;
	border-bottom: 1px solid black;
}

.rpgm-homebrew-field-container[editing="true"] {
	background-color: #00000044;
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
	font-style: italic;
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
.rpgm-homebrew-field-container:hover:not(.rpgm-homebrew-field-container-move) .rpgm-icons {
	opacity: 1;
	filter: blur(0px);
	visibility: visible;
}
</style>
