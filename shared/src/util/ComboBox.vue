<script setup lang="ts" generic="T">
const { values, unique, filter, display, assign, max } = defineProps<{
	values: T[],
	unique: (v: T) => string | number | symbol,
	filter: (v: T, t: string) => boolean,
	display: (v: T) => string,
	assign?: (v: T) => T,
	max?: number,
	placeholder?: string
}>();

const isOpen = ref(false);

const inputRef = useTemplateRef("inputRef");

const value = defineModel<T>();
const input = ref("");

const filtered = computed(() => {
	return values.filter(v => filter(v, input.value)).slice(0, max);
});

/**
 * A selection was made, now update the value and close the input
 * @param t - The item that was selected
 */
function select(t: T) {
	value.value = assign ? assign(t) : t;
	input.value = display(t);
	inputRef.value?.blur();
	isOpen.value = false;
}

/**
 * @param k - Keyboard event
 */
function keyDown(k: KeyboardEvent) {
	if (k.key == "Enter") {
		if (input.value.length == 0) return;
		isOpen.value = false;
		// Get and set to first filtered item
		if (filtered.value[0]) {
			select(filtered.value[0]);
		}
	} else if (k.key == "Escape") {
		isOpen.value = false;
		input.value = "";
	} else {
		isOpen.value = true;
	}
}
</script>

<template>
	<div class="rpgm-combobox" @focusin="isOpen = true">
		<input ref="inputRef" v-model="input" :placeholder class="rpgm-input" @keydown="keyDown">
		<div>
			<ul class="rpgm-dropdown" :open="isOpen">
				<li v-for="v in filtered" :key="unique(v)" tabindex="0" class="rpgm-dropdown-item" @click="select(v)"
					@keydown.space.enter.prevent="select(v)">
					{{ display(v) }}
				</li>
			</ul>
		</div>
	</div>
</template>

<style>
.rpgm-combobox {
	position: relative;
	display: flex;
	flex-wrap: wrap;
}

.rpgm-combobox:focus-within .rpgm-dropdown:has(>.rpgm-dropdown-item)[open="true"] {
	opacity: 1;
	visibility: visible !important;
}

.rpgm-combobox .rpgm-input {
	margin-left: 3px;
	margin-right: 3px;
	padding-top: 6px;
	padding-bottom: 6px;
}

.rpgm-combobox .rpgm-input::placeholder {
	font-style: italic;
}

.rpgm-dropdown {
	padding: 4px;
	position: absolute;
	width: 100%;
	max-height: 300px;
	background: var(--color-cool-5-90);
	transition: all 0.25s;
	opacity: 0;
	visibility: hidden;
	border-radius: 6px;
	overflow: auto;
	z-index: 1;
}

div:has(>.rpgm-dropdown) {
	position: relative;
	width: 100%;
}

.rpgm-dropdown-item {
	font-family: var(--font-primary);
	font-size: var(--font-size-14);
	outline: none;
	color: white;
}

.rpgm-dropdown-item:focus,
.rpgm-dropdown-item:hover {
	backdrop-filter: brightness(0.75);
}
</style>
