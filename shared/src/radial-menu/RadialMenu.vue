<template>
	<div :class="{ pressed: buttonPressed }" @focusout="focusOut" class="radial-menu-container" ref="root" :open="isOpen"
		:style="[rootStyle, floatingStyles]">
		<button class="radial-menu-center" ref="center" :class="{ pressed: centerPressed }"
			@keydown.space="centerPressed = true" @keyup.space="centerPressed = false" @click.prevent="toggleOpen">
			<img :src="diceImage" class="center-image">
		</button>

		<div class="submenu-group">
			<div v-for="(item, index) in items" ref="tooltip" :key="index" class="submenu-button-container"
				:style="getSubButtonStyle(index)">
				<button :tabindex="isOpen ? 0 : -1" @focusin="focusIn" class="submenu-button"
					@keydown.space="buttonPressed = true" @keyup.space="buttonPressed = false"
					@click.prevent="onSubButtonClick(index, item.callback)">
					<img :src="buttonImage" :style="{ filter: `hue-rotate(${item.color}) saturate(1.5) brightness(1.5)` }"
						class="button-image">
					<i class="button-icon" :class="item.icon"></i>
					<!--Tooltip-->
					<span :v-show="isOpen" class="radial-menu-tooltip">{{ item.tooltip }}</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, toRef, inject, computed } from 'vue'
import { autoUpdate, offset, useFloating } from '@floating-ui/vue'
import diceImage from '../../assets/d20-128x128.png'
import buttonImage from '../../assets/d20.png'
import { shift } from '@floating-ui/vue'

const ANIMATION_DURATION = 0.15
const RADIUS = 45

export interface InjectedElement {
	element: HTMLElement
	get value(): string
	set value(value: string)
}

type CallbackParams = {
	element: InjectedElement
}

// Type definitions for the menu items and settings
export interface RadialMenuItem {
	color: string
	image?: string
	icon?: string
	callback: (params: CallbackParams) => void
	tooltip: string
}

const element = inject<InjectedElement>('element') as InjectedElement
const items = inject<RadialMenuItem[]>('items', [])

// States for menu open/close and hover
const isOpen = ref(false)
const centerPressed = ref(false)
const buttonPressed = ref(false)
const root = useTemplateRef('root')
const center = useTemplateRef('center')

const anchor = computed((): 'right' | 'right-start' => {
	// If element has multiple lines, anchor to right-start
	if (element.element instanceof HTMLInputElement) {
		return 'right'
	} else if (element.element instanceof HTMLTextAreaElement) {
		return element.element.rows > 1 ? 'right-start' : 'right'
	}
	return 'right-start'
})

/** Slide radial menu if anchored to top-end */
const rootStyle = computed(() => ({
	width: `${isOpen.value && anchor.value === 'right-start' ? RADIUS * 2.5 : 30}px`,
	height: `${30}px`,
}))

const padding = () =>
	offset(() => {
		const padding = parseInt(document.defaultView?.getComputedStyle(element.element).padding || '0')
		return {
			mainAxis: -padding / 2,
			crossAxis: anchor.value === 'right-start' ? padding / 2 : 0,
		}
	})

const widthOffset = () =>
	offset(({ rects }) => {
		const centerWidth = center.value?.offsetWidth || 0
		return {
			// Keep the menu in the top right
			mainAxis: anchor.value === 'right-start' ? -rects.floating.width / 2 - centerWidth / 2 : -rects.floating.width,
		}
	})

const { floatingStyles } = useFloating(toRef(element.element), root, {
	placement: anchor.value,
	middleware: [
		padding(),
		widthOffset(),
		shift({ crossAxis: true, padding: 5, rootBoundary: 'viewport' }),
	],
	whileElementsMounted(reference, floating, update) {
		return autoUpdate(reference, floating, update)
	},
})

function onSubButtonClick(_: number, callback: (params: CallbackParams) => void) {
	// Then close the menu
	isOpen.value = false
	center.value?.blur()
	// Invoke the submenu callback
	callback({ element })
}

function toggleOpen() {
	isOpen.value = !isOpen.value
}

function focusIn() {
	isOpen.value = true
}

// TODO: Ignore if focus is switching to another button
function focusOut(event: FocusEvent) {
	if (root.value?.contains(event.relatedTarget as HTMLElement)) return
	isOpen.value = false
}

/**
 * Compute the style for each sub-button, including:
 * - The angle at which it’s placed (between startAngle and endAngle)
 * - The radial animation transform
 * - A stagger delay based on the button index
 */
function getSubButtonStyle(index: number) {
	const itemCount = items.length
	if (itemCount === 0) {
		return {}
	}

	const anglePerItem = 360 / itemCount

	// actual angle for this button
	const angle = -45 + index * anglePerItem

	const rad = (Math.PI / 180) * angle

	// TODO: Determine the size of the button and overflow if needed to new rings

	// Final X, Y offset if open
	const finalX = Math.cos(rad) * RADIUS
	const finalY = Math.sin(rad) * RADIUS

	/** Stagger delay to collectively take {@link ANIMATION_DURATION}
	Reverse the delay if closing */
	const staggerDelay = (ANIMATION_DURATION / itemCount) * (isOpen.value ? index : itemCount - index)

	// If open => transform to final position with scale(1)
	// If not => scale(0) at the center
	const transform = isOpen.value
		? `rotate(0deg) translate(${finalX}px, ${finalY}px) rotate(0deg) scale(1)`
		: `rotate(-90deg) translate(0, 0) rotate(-360deg) scale(0)`

	return {
		transform,
		opacity: isOpen.value ? 1 : 0,
		transitionDelay: `${staggerDelay}s, ${staggerDelay}s, 20s, ${0}s`,
	}
}

</script>

<style scoped>
.radial-menu-container {
	transition: width 0.2s;
}

.radial-menu-container[open="false"] {
	transition-delay: 0.15s;
}

.radial-menu-center {
	position: absolute;
	width: 30px;
	height: 30px;
	max-height: 30px;
	background: none !important;
	box-shadow: none !important;
	border: none !important;
	border-radius: 50%;
	transition: background 0.2s ease;
	cursor: pointer;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	transform-origin: top left;
	z-index: 1;
	animation: fade-in 0.2s ease;
	transition: scale 0.05s ease, opacity 0.05s ease;
	opacity: 0.5;
}

.radial-menu-container[open="false"]>.radial-menu-center {
	z-index: 5;
}

.pressed,
.radial-menu-center:active {
	scale: 1 !important;
}

.radial-menu-center:hover,
.radial-menu-center:focus,
.radial-menu-center:active,
.radial-menu-container[open="true"]>.radial-menu-center {
	scale: 1.2;
	opacity: 1 !important;
	transition-delay: 0s;
}

.center-image {
	width: 100% !important;
	height: 100% !important;
	position: absolute;
	top: -50%;
	left: -50%;
	transform: translate(50%, 50%);
	border: none !important;
	transition: filter 0.05s;
	filter: drop-shadow(2px 2px 2px #00000044);
}

.radial-menu-center:hover>.center-image,
.radial-menu-center:focus>.center-image {
	filter: drop-shadow(2px 2px 2px #6633ccaa);
}

@keyframes fade-in {
	from {
		opacity: 0;
	}
}

.submenu-group {
	position: absolute;
	width: 30px;
	height: 30px;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	overflow: visible;
	z-index: 2;
}

.submenu-button-container {
	width: 100%;
	height: 100%;
	position: absolute;
	transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

.submenu-button {
	position: relative;
	display: block;
	width: 100%;
	height: 100%;
	background: none !important;
	border: none !important;
	box-shadow: none !important;
	margin: 0;
	padding: 0;
	border-radius: 50%;
	cursor: pointer;
	pointer-events: all;
	opacity: 0.9;
}

.radial-menu-container:not(.pressed)[open="true"] {

	.submenu-group:not(:focus-within) .submenu-button:hover,
	.submenu-button:focus:not(:active) {
		opacity: 1;
		z-index: 9;

		.button-icon,
		.button-image {
			scale: 1.2;
			animation: jiggle 0.15s ease;
		}

		.radial-menu-tooltip {

			opacity: 1;
		}
	}
}

.submenu-group:not(:focus-within) .submenu-button-container:has(.submenu-button:hover),
.submenu-button-container:has(.submenu-button:focus) {
	z-index: 9;
}

.button-icon,
.button-image {
	transition: opacity 0.1s ease, scale 0.1s ease;
}

.button-icon {
	color: white;
	position: absolute;
	opacity: 0.6;
	left: 50%;
	top: 50%;
	translate: -50% -50%;
}

@keyframes jiggle {
	0% {
		transform: rotate(0deg);
	}

	25% {
		transform: rotate(5deg);
	}

	75% {
		transform: rotate(-5deg);
	}

	100% {
		transform: rotate(0deg);
	}
}

.submenu-button:hover>.button-icon {
	opacity: 0.75;
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

.radial-menu-tooltip {
	position: absolute;
	bottom: 30px;
	left: 50%;
	padding: 2px;
	line-height: 1.2;
	translate: -50% 0;
	/* No word wrapping */
	white-space: nowrap;
	pointer-events: none;
	background: #6633cc;
	color: #fff;
	border-radius: 4px;
	z-index: 7;
	opacity: 0;
}
</style>
