<template>
	<button
		class="dice-button"
		:class="{ pressed, loading: context.loading }"
		@click.prevent="onClick"
		@keydown.space="pressed = true"
		@keyup.space="pressed = false"
	>
		<img
			:src="buttonImage"
			:style="[colorStyle, rotationStyle]"
			class="button-image"
		>
		<i
			class="button-icon"
			:class="button.icon"
		/>
		<span
			v-if="button.tooltip"
			class="radial-menu-tooltip"
		>{{ rpgm.localize(button.tooltip) }}</span>
	</button>
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue';

import buttonImage from '../../assets/d20.png';

const rpgm = globalThis.rpgm;
const pressed = ref(false);

const emit = defineEmits(['click']);
const context = defineModel<ButtonContext>({ required: true });
const { button, rotation = 'uniform' } = defineProps<{
	button: RadialButton<ButtonContext>,
	rotation?: 'uniform' | 'random'
}>();

const colorStyle = computed<StyleValue>(() => ({
	filter: `hue-rotate(${button.category.color ?? 0}) saturate(1.25) brightness(1.5)`
}));

const rotationStyle = computed<StyleValue>(() =>
	rotation === 'uniform' ? {
		rotate: `${Math.floor(Math.random() * 3) * 120}deg`
	} : {
		rotate: `${Math.random() * 360}deg`
	});

/**
 * Execute this button's callback and set loading state to true.
 * @param event - The {@link MouseEvent} used to detect the shift modifier
 */
async function onClick(event: MouseEvent) {
	if (context.value.loading) return;
	emit('click');
	context.value.loading = true;
	context.value.shift = event.shiftKey;
	await button.callback(context.value);
	document.body.blur();
	context.value.element.focus();
	context.value.loading = false;
}
</script>

<style>
/* Override styles from outside the radial menu */
.radial-menu-container,
.radial-menu-container *,
.dice-button {
	outline: none !important;
	border: none !important;
	box-shadow: none !important;
}

.dice-button {
	will-change: transform;
	position: absolute;
	display: block;
	background: none !important;
	cursor: pointer;
	pointer-events: all;
	opacity: 0.9;
	transition-property: all !important;
	transition-duration: 0.2s !important;
	width: 30px !important;
	height: 30px !important;
	filter: drop-shadow(2px 2px 0px #00000044);
	top: 50%;
	left: 50%;
	translate: -50% -50%;
}

/* Standalone button */
:not(.submenu-group)>.dice-button:hover:not(:active):not(.loading),
/* Submenu button */
.dice-button:focus:not(.loading),
.submenu-group:not(:focus-within) .dice-button:hover:not(.loading) {
	opacity: 1;
	z-index: 1;

	.button-icon,
	.button-image {
		scale: 1.2;
	}

	.button-icon {
		opacity: 0.75;
	}

	.button-image {
		animation: jiggle 0.15s ease;
	}

	.radial-menu-tooltip {
		opacity: 1;
		z-index: 1;
	}
}

.radial-menu-tooltip {
	position: absolute;
	right: 120%;
	top: 50%;
	transform: translateY(-50%);
	padding-left: 4px;
	padding-right: 4px;
	padding-top: 2px;
	padding-bottom: 2px;
	line-height: 1.2;
	white-space: nowrap;
	pointer-events: none;
	background: #6633cc;
	color: #fff;
	border-radius: 4px;
	opacity: 0;
}

.button-icon {
	color: white;
	position: absolute;
	opacity: 0.6;
	left: 50%;
	top: 50%;
	translate: -50% -50%;
}

.button-image {
	position: absolute;
	margin: 0;
	top: 0;
	left: 0;
	object-fit: cover;
	pointer-events: none;
	border: none !important;
	width: 100% !important;
	height: 100% !important;
}

.button-icon,
.button-image {
	transition: opacity 0.1s ease, scale 0.1s ease;
}
</style>
