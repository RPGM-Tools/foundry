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

function remove() {
	data.schema!.fields.splice(data.schema!.fields.indexOf(field), 1);
	emit("modified");
}

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

function validateNewDescription(_d: string): boolean {
	return true;
}

function redescription(force: boolean = false) {
	if (!descriptionRef.value) return;
	if (force)
		editing.value = false;
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

function move(by: number) {
	const idx = data.schema!.fields.indexOf(field);
	const newIdx = Math.max(0, Math.min(data.schema!.fields.length - 1, idx + by));
	if (newIdx === idx) return;

	data.schema!.fields.splice(idx, 1);
	data.schema!.fields.splice(newIdx, 0, field);
	emit("modified");
}

function tryBlur(e: FocusEvent) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	if (fieldContainer.value?.contains(e.relatedTarget as HTMLElement)) return;
	editing.value = false;
}

function restore(element: HTMLElement | null, value: string) {
	if (element)
		element.innerText = value;
	// editing.value = false;
}

function startEdit() {
	editing.value = true;
	void nextTick(() => {
		if (!nameRef.value) return;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		nameRef.value.focus();
		nameRef.value.innerText = String(nameRef.value.innerText);
		const range = document.createRange();
		range.selectNodeContents(nameRef.value);
		range.collapse();
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);
	});
}
</script>

<template>
	<div ref="fieldContainer" class="rpgm-homebrew-field-container" @keydown.escape.prevent="editing = false"
		:editing="editing" :key="field.name" @focusout="tryBlur">
		<div class="rpgm-icons">
			<a @click="remove"><i class="fa-solid fa-circle-xmark"></i></a>
			<a @click="move(-1)" v-if="i != -1"><i class="fa-solid fa-circle-up"></i></a>
			<a @click="move(1)" v-if="i != 1"><i class="fa-solid fa-circle-down"></i></a>
			<a @click="startEdit"><i class="fa-solid fa-feather"></i></a>
		</div>
		<h3 ref="name" class="rpgm-homebrew-field-name rpgm-radial-ignore" :contenteditable="editing"
			@keydown.enter.prevent="rename(true)" @blur="rename(false)" @keydown.escape="restore(nameRef, field.name)">{{
				field.name }}</h3>
		<input class="rpgm-homebrew-field-value rpgm-input rpgm-radial-ignore" v-model="fieldValue"
			:placeholder="localize('RPGM_FORGE.HOMEBREW.PLACEHOLDER')" />
		<div ref="description" v-show="editing || field.description.length > 0"
			class="rpgm-homebrew-field-description rpgm-radial-ignore" :contenteditable="editing"
			@keydown.enter.exact.prevent="redescription(true)" @blur="redescription(false)"
			@keydown.escape="restore(descriptionRef, field.description)">{{
				field.description }}</div>
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

.rpgm-homebrew-field-container[editing="true"] {
	backdrop-filter: brightness(0.75);
}

.rpgm-homebrew-field-container[editing="true"] [contenteditable="true"] {
	font-style: italic;
	outline: none;
}

.rpgm-homebrew-field-value {
	background: #ffffffaa;
}

.rpgm-homebrew-field-description {
	padding-bottom: 4px;
}

.rpgm-homebrew-field-value:focus::placeholder {
	opacity: 0.75;
}

.rpgm-homebrew-field-value::placeholder {
	opacity: 0;
}

.rpgm-homebrew-field-container>* {
	margin: 2px;
}

.rpgm-homebrew-field-container .rpgm-icons {
	direction: rtl;
	right: 0;
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
