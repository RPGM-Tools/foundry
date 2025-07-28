<script setup lang="ts">
const value = defineModel<string>({ required: true });
const editing = defineModel<boolean>("editing", { required: true });

const slot = ref<HTMLElement | null>(null);

const { shouldFocus = true, shouldBlur = true, multiline = true } = defineProps<{
	/** Set this to false to handle focus manually */
	shouldFocus?: boolean
	/** Set this to false to handle blur manually */
	shouldBlur?: boolean
	/** Set this to false to disallow multilines */
	multiline?: boolean
}>();

watch(editing, (v) => {
	if (v) startEdit();
});

/** Selects everything in the element */
function selectAll() {
	if (!slot.value) return;
	slot.value.focus();
	const range = document.createRange();
	range.selectNodeContents(slot.value);
	const sel = window.getSelection();
	sel?.removeAllRanges();
	sel?.addRange(range);
}

/**
 * Enables editing of value and optionally selects contents
 */
function startEdit() {
	if (shouldFocus)
		void nextTick(selectAll);
}

/**
 * Handles input for slot
 * @param e - Keyboard event
 */
function keyDown(e: KeyboardEvent) {
	switch (e.key) {
		case "Enter": {
			// Disallow newlines in the right circumstances
			if (e.shiftKey) {
				if (!multiline)
					e.preventDefault();
			}
			else if (!multiline) {
				e.preventDefault();
				blur();
			}
			break;
		} case "Escape": {
			e.preventDefault();
			slot.value!.innerText = value.value;
			blur();
			break;
		}
	}
}

/** Called when focus is passed to this element */
function focus() {
	if (editing.value)
		selectAll();
}

/** Saves value and clears the selection */
function blur() {
	value.value = slot.value!.innerText.trim();
	void nextTick(() => {
		if (slot.value)
			// Keep innerText synced with value
			slot.value.innerText = value.value;
		if (!shouldBlur) return;
		editing.value = false;
		window.getSelection()?.removeAllRanges();
	});
}
</script>

<template>
	<slot :ref="(el: unknown) => { slot = el as HTMLElement }" :contenteditable="editing" @focus="focus"
		@keydown="keyDown" @blur="blur" />
</template>
