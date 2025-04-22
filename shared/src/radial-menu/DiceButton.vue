<!--TODO: extract individual dice button-->
<template>
	<button class="dice-button" :class="{ pressed }" @click.prevent="onClick" @keydown.space="pressed = true"
		@keyup.space="pressed = false">
		<img :src="buttonImage" :style="[colorStyle, rotationStyle]" class="button-image">
		<i class="button-icon" :class="button.icon"></i>
		<span v-if="button.tooltip" class="radial-menu-tooltip">{{ localize(button.tooltip) }}</span>
	</button>
</template>

<script setup lang="ts">
import { computed, inject, ref, type StyleValue, watch } from 'vue';
import buttonImage from '../../assets/d20.png'
import { localize } from '../util/util';

const pressed = ref(false)

const emit = defineEmits(['click'])
const menuContext = inject<ButtonContext>('context') as ButtonContext
const { button, rotation = "uniform" } = defineProps<{
	button: RadialButton<ButtonContext>,
	index: number,
	rotation?: "uniform" | "random"
}>()

const colorStyle = computed<StyleValue>(() => ({
	filter: `hue-rotate(${button.category.color ?? 0}) saturate(1.25) brightness(1.5)`
}))

watch(() => menuContext.element, (value) => {
	rpgm.logger.log(value)
})

const rotationStyle = computed<StyleValue>(() =>
	rotation === 'uniform' ? {
		rotate: `${Math.floor(Math.random() * 3) * 120}deg`
	} : {
		rotate: `${Math.random() * 360}deg`
	})

async function onClick() {
	emit('click')
	menuContext.loading = true
	await button.callback(menuContext)
	menuContext.loading = false
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
	top: 50%;
	left: 50%;
	translate: -50% -50%;
}

.submenu-group:not(:focus-within) .dice-button:hover,
.dice-button:focus:not(:active) {
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
	bottom: 30px;
	left: 50%;
	padding: 2px;
	line-height: 1.2;
	translate: -50% 0;
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
	translate: -50%, -50%;
	object-fit: cover;
	pointer-events: none;
	width: 100% !important;
	height: 100% !important;
}

.button-icon,
.button-image {
	transition: opacity 0.1s ease, scale 0.1s ease;
}
</style>
