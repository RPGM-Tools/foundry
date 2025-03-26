<template>
	<div class="radial-menu-container" ref="root" :open="isOpen" @focusout="focusOut"
		:style="[rootStyle, floatingStyles]">
		<button class="radial-menu-center" ref="center" :class="{ pressed }" @keydown.space="pressed = true"
			@keyup.space="pressed = false" @click.prevent="toggleOpen">
			<img :src="diceImage" class="center-image">
		</button>
		<!-- <TransitionGroup name="radial-submenu" tag="div" :style="{ zIndex: isOpen ? 199 : 99 }" class="submenu-group"> -->
		<div class="submenu-group">
			<div v-for="(item, index) in items" :key="index" class="submenu-button-container"
				:style="getSubButtonStyle(index)">
				<button :tabindex="isOpen ? 0 : -1" @focusin="focusIn" class="submenu-button"
					:style="{ background: item.color }" @click.prevent="onSubButtonClick(index, item.callback)"
					@mousedown.prevent="onSubButtonClick(index, item.callback)">
					<img v-if="item.image" :src="item.image" class="menu-image" />
					<i v-else-if="item.icon" class="menu-icon" :class="item.icon"></i>
				</button>
			</div>
		</div>
		<!-- </TransitionGroup> -->
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, toRef, inject, computed } from 'vue'
import { autoUpdate, offset, useFloating } from '@floating-ui/vue'
import diceImage from '../assets/d20-128x128.png'

const ANIMATION_DURATION = 0.15
const RADIUS = 45

export interface InjectedElement {
	element: HTMLElement | null
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
}

const element = inject<InjectedElement>('element') as InjectedElement
const items = inject<RadialMenuItem[]>('items', [])

// States for menu open/close and hover
const isOpen = ref(false)
const pressed = ref(false)
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
	width: `${isOpen.value && anchor.value === 'right-start' ? RADIUS * 2.3 : 30}px`,
	height: `${30}px`,
}))

const padding = () =>
	offset(({ rects }) => {
		return {
			mainAxis: -rects.floating.width,
		}
	})

const { floatingStyles } = useFloating(toRef(element.element), root, {
	placement: anchor.value,
	middleware: [
		padding(),
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
		? `rotate(0deg) translate(${finalX}px, ${finalY}px) scale(1)`
		: `rotate(-90deg) translate(0, 0) scale(0)`

	return {
		transform,
		opacity: isOpen.value ? 1 : 0,
		transitionDelay: `${staggerDelay}s, ${staggerDelay}s, 0s, 0s`,
	}
}

</script>

<style scoped>
.radial-menu-container {
	transition: width 0.2s ease, height 0.2s ease;
	z-index: 9999999;
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
	z-index: 9999999;
	animation: fade-in 0.2s ease;
	transition: scale 0.05s ease, opacity 0.05s ease;
	opacity: 0.5;
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
}

.submenu-button-container {
	width: 100%;
	height: 100%;
	position: absolute;
	transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

.submenu-button {
	display: block;
	width: 100%;
	height: 100%;
	border: none !important;
	box-shadow: none !important;
	padding: 0;
	border-radius: 50%;
	position: absolute;
	overflow: hidden;
	transition: box-shadow 0.1s ease, scale 0.1s ease;
	cursor: pointer;
	pointer-events: all;
}

.submenu-group:not(:focus-within) .submenu-button:hover,
.submenu-button:focus:not(:active) {
	scale: 1.2;
	box-shadow: 0px 0px 4px #6633cc !important;
	z-index: 2;
}

.menu-image,
.menu-icon {
	margin: 0;
	object-fit: cover;
	pointer-events: none;
	width: 100% !important;
	height: 100% !important;
}
</style>
