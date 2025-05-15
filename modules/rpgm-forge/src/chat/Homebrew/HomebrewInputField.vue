<script setup lang="ts">

const data = inject<ForgeChatHomebrew>("data")!;

const fieldValue = defineModel<string | number | boolean | undefined>({ required: true });
const { field, i } = defineProps<{ field: HomebrewField, i: -1 | 0 | 1 }>();
const emit = defineEmits<{
	renaming: []
	modified: []
}>();

const localize = rpgm.localize;
const editing = ref(false);
const fieldContainer = useTemplateRef("fieldContainer");
const nameRef = useTemplateRef("name");
const descriptionRef = useTemplateRef("description");

/**
 * Checks to see if a field can be renamed to {@link n} 
 * @param n - The name to validate
 * @returns Whether or not this name is valid
 */
function validateNewName(n: string): boolean {
	if (n === field.name) return false;
	if (n.length == 0) {
		rpgm.forge!.logger.errorU("Homebrew field cannot be empty!");
		return false;
	}
	for (const f of data.schema!.fields) {
		if (f === field) continue;
		if (f.name.slugify({ strict: true, replacement: "_" })
			=== n.slugify({ strict: true, replacement: "_" })) {
			rpgm.forge!.logger.errorU(`"${f.name}" already exists!`);
			return false;
		}
	}
	return true;
}

/** Deletes this field from the schema */
function remove() {
	data.schema!.fields.splice(data.schema!.fields.indexOf(field), 1);
	emit("modified");
}

/** 
 * Renames this field in the schema
 * @param force - Whether or not to exit out of editing mode
 */
function rename(force: boolean = false) {
	if (!nameRef.value) return;
	if (force)
		editing.value = false;
	window.getSelection()?.removeAllRanges();
	const newText = nameRef.value.innerText as string;
	const success = validateNewName(newText.trim());
	if (success) {
		emit("renaming");
		emit("modified");
		void nextTick(() => {
			if (!nameRef.value) return;
			nameRef.value.innerText = newText.trim();
			// eslint-disable-next-line vue/no-mutating-props
			field.name = newText.trim();
		});
	} else {
		nameRef.value.innerText = field.name;
	}
}

/** 
 * Checks to see if a field can be redescribed to {@link _d} 
 * @param _d - The description to validate
 * @returns Whether or not this name is valid
 */
function validateNewDescription(_d: string): boolean {
	return true;
}

/**
 * Redescribes this field in the schema
 * @param force - Whether or not to exit out of editing mode
 */
function redescription(force: boolean = false) {
	if (!descriptionRef.value) return;
	if (force)
		editing.value = false;
	window.getSelection()?.removeAllRanges();
	const newText = descriptionRef.value.innerText as string;
	const success = validateNewDescription(newText.trim());
	if (success) {
		emit("modified");
		// eslint-disable-next-line vue/no-mutating-props
		field.description = newText.trim();
	}
	else
		descriptionRef.value.innerText = field.description;
}

/** 
 * Reorders this field in the schema 
 * @param by - How many fields to move forwards or backwards
 */
function move(by: number) {
	const idx = data.schema!.fields.indexOf(field);
	const clippedIdx = Math.max(0, Math.min(data.schema!.fields.length - 1, idx + by));
	if (clippedIdx === idx) return;

	data.schema!.fields.splice(idx, 1);
	data.schema!.fields.splice(clippedIdx, 0, field);
	emit("modified");
}

/**
 * Ignore focus changes within the field, else disable editing mode
 * @param e - The {@link FocusEvent} to detect the target of blur
 */
function tryBlur(e: FocusEvent) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	if (fieldContainer.value?.contains(e.relatedTarget as HTMLElement)) return;
	editing.value = false;
}

/**
 * Cancel editing this field
 * @param element - The element to restore text to
 * @param value - The value to restore to this 
 */
function restore(element: HTMLElement | null, value: string) {
	if (element)
		element.innerText = value;
}

/**
 * Enables editing of name and description divs and moves the cursor to the end of the name div
 */
function startEdit() {
	editing.value = true;
	void nextTick(() => {
		if (!nameRef.value) return;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		nameRef.value.focus();
		const range = document.createRange();
		range.selectNodeContents(nameRef.value);
		// range.collapse();
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);
	});
}

/**
 * Override tab functionality to select contents of element
 * @param e - Keyboard event
 * @param element - The element to select
 */
function selectElement(e: KeyboardEvent, element: HTMLElement) {
	if (!editing.value) return;
	e.preventDefault();
	element.focus();
	const range = document.createRange();
	range.selectNodeContents(element);
	// range.collapse();
	const sel = window.getSelection();
	sel?.removeAllRanges();
	sel?.addRange(range);
}
</script>

<template>
	<div ref="fieldContainer" class="rpgm-homebrew-field-container" @keydown.escape.prevent="editing = false"
		:editing="editing" :key="field.name" @focusout="tryBlur">
		<div class="rpgm-icons">
			<a @click="remove" placeholder="Remove"><i class="fa-solid fa-trash"></i></a>
			<a @click="startEdit"><i class="fa-solid fa-feather"></i></a>
			<a @click="move(-1)" v-if="i != -1"><i class="fa-solid fa-circle-up"></i></a>
			<a @click="move(1)" v-if="i != 1"><i class="fa-solid fa-circle-down"></i></a>
		</div>
		<h3 ref="name" class="rpgm-homebrew-field-name rpgm-radial-ignore" :contenteditable="editing"
			@keydown.enter.prevent="rename(true)" @keydown.tab.exact="e => selectElement(e, descriptionRef!)"
			@blur="rename(false)" @keydown.escape="restore(nameRef, field.name)">{{
				field.name }}</h3>
		<div ref="description" v-show="editing || field.description.length > 0"
			class="rpgm-homebrew-field-description rpgm-radial-ignore" :contenteditable="editing"
			@keydown.enter.exact.prevent="redescription(true)" @keydown.tab.shift="e => selectElement(e, nameRef!)"
			@blur="redescription(false)" @keydown.escape="restore(descriptionRef, field.description)">{{
				field.description }}</div>
		<input class="rpgm-homebrew-field-value rpgm-input rpgm-radial-ignore"
			@keydown.tab.shift="e => selectElement(e, descriptionRef!)" v-model="fieldValue"
			:placeholder="localize('RPGM_FORGE.HOMEBREW.PLACEHOLDER')" />
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
	background: #ffffffaa;
	margin-bottom: 3px;
}

.rpgm-homebrew-field-description {
	font-style: italic;
}

.rpgm-homebrew-field-value:focus::placeholder {
	opacity: 0.75;
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
