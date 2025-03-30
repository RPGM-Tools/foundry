<template>
	<div v-if="Items.length > 0" :class="{ pressed: buttonPressed }" @focusout="focusOut" class="radial-menu-container"
		ref="root" :open="isOpen" :style="[rootStyle, radialFloater.floatingStyles.value]">
		<button class="radial-menu-center" ref="center" :style="{ width: `${centerSize}px`, height: `${centerSize}px` }"
			:class="{ pressed: centerPressed }" @keydown.space="centerPressed = true" @keyup.space="centerPressed = false"
			@click.prevent="toggleOpen">
			<img :src="diceImage" class="center-image">
		</button>

		<div class="submenu-group">
			<button v-for="(item, index) in Items" :key="index" ref="tooltip" :tabindex="isOpen ? 0 : -1"
				:style="buttonStyle[index]" class="submenu-button" @keydown.space="buttonPressed = true"
				@keyup.space="buttonPressed = false" @click.prevent="onSubButtonClick(index, item.callback)">
				<img :src="buttonImage"
					:style="{ filter: `hue-rotate(${getCategory(item)?.color ?? 0}) saturate(1.25) brightness(1.5)`, rotate: `${randRotation[index]}deg` }"
					class="button-image">
				<i class="button-icon" :class="item.icon"></i>
				<span v-if="item.tooltip" class="radial-menu-tooltip">{{ localize(item.tooltip) }}</span>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, toRef, inject, computed, onMounted, onUnmounted } from 'vue'
import { autoUpdate, offset, useFloating } from '@floating-ui/vue'
import diceImage from '../../assets/d20-128x128.png'
import buttonImage from '../../assets/d20.png'
import { shift } from '@floating-ui/vue'
import { localize } from '#/util/util'

const ANIMATION_DURATION = 0.15
const MAX_CENTER_SIZE = 35

export interface InjectedElement {
	element: HTMLElement
	get value(): string
	set value(value: string)
}
const randRotation = computed(() => Items.value.map(() => Math.random() * 360))
const element = inject<InjectedElement>('element') as InjectedElement
const items = inject<MenuButton[]>('items', [])
const getCategory = (item: MenuButton) => rpgm.radialMenu.categories.get(item.category)

// States for menu open/close and hover
const isOpen = ref(false)
const centerPressed = ref(false)
const buttonPressed = ref(false)
const root = useTemplateRef('root')
const center = useTemplateRef('center')

const Items = computed(() => {
	return items.filter(value => value.detective({ element: element.element }))
})

const anchor = computed((): 'right' | 'right-start' => {
	// If element has multiple lines, anchor to right-start
	if (element.element instanceof HTMLInputElement) {
		return 'right'
	} else if (element.element instanceof HTMLTextAreaElement) {
		return element.element.rows > 1 ? 'right-start' : 'right'
	}
	return 'right-start'
})

/** Expand radial menu when open, used for overflow protection */
const rootStyle = computed(() => ({
	width: `${isOpen.value ? radius.value * 2 + centerSize.value : 30}px`,
	height: `${isOpen.value ? radius.value * 2 + centerSize.value : 30}px`,
}))

/* 
_updateSize is a hack to fix the radial menu not updating
its dimensions when its parent input element becomes visible
*/
let _updateSize = ref(0)
onMounted(() => {
	new ResizeObserver(() => setTimeout(() => { _updateSize.value++; radialFloater.update() }, 1)).observe(element.element)
})

const centerSize = computed(() => {
	_updateSize.value
	return Math.min(element.element.scrollHeight, MAX_CENTER_SIZE)
})

onUnmounted(() => console.log("Unmounted"))

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
		return {
			// Keep the menu in the top right
			mainAxis: anchor.value === 'right-start' ? -rects.floating.width / 2 - centerSize.value / 2 : -rects.floating.width / 2 - centerSize.value / 2,
			crossAxis: anchor.value === 'right-start' ? -rects.floating.height / 2 + centerSize.value / 2 : 0,
		}
	})

const radialFloater = useFloating(toRef(element.element), root, {
	placement: anchor.value,
	middleware: [
		padding(),
		widthOffset(),
		shift({ crossAxis: true, padding: 5, boundary: document.body, altBoundary: true, rootBoundary: 'document' }),
	],
	whileElementsMounted(reference, floating, update) {
		return autoUpdate(reference, floating, update, { animationFrame: true })
	},
})

function onSubButtonClick(_: number, callback: (params: MenuContext) => void) {
	// Then close the menu
	isOpen.value = false
	center.value?.blur()
	// Invoke the submenu callback
	callback({ element: element.element })
}

function toggleOpen() {
	isOpen.value = !isOpen.value;
	// Fix overlap of subsequent radial menus
	if (root.value?.parentElement)
		root.value.parentElement.style.zIndex = isOpen.value ? "999" : "99"
}

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
const buttonStyle = computed(() => {
	return Items.value.map((_, index) => getSubButtonStyle(index))
})

const radius = computed(() => {
	return Math.max(centerSize.value * 1.25, centerSize.value / Math.sin(2 * Math.PI / Math.max(3, Items.value.length)))
})


function getSubButtonStyle(index: number) {
	const itemCount = Items.value.length
	const anglePerItem = 360 / itemCount
	const angle = index * anglePerItem - 45
	const radians = (Math.PI / 180) * angle

	// Calculate the radius from how many items such that they don't overlap
	// Final X, Y offset if open
	const finalX = Math.cos(radians) * radius.value
	const finalY = Math.sin(radians) * radius.value

	/** Stagger delay to collectively take {@link ANIMATION_DURATION}
	Reverse the delay if closing */
	const staggerDelay = (ANIMATION_DURATION / itemCount) * (isOpen.value ? index : itemCount - index)

	// If open => transform to final position with scale(1)
	// If not => scale(0) at the center
	const transform = isOpen.value
		? `rotate(0deg) translate(${finalX}px, ${finalY}px) rotate(0deg) scale(1)`
		: `rotate(-90deg) translate(0px, 0px) rotate(-360deg) scale(0)`

	return {
		scale: Number(isOpen.value),
		transform,
		opacity: isOpen.value ? 1 : 0,
		transitionDelay: `${staggerDelay}s`,
	}
}

</script>

<style scoped>
.radial-menu-container {
	transition: width 0.2s ease, height 0.2s ease !important;
	pointer-events: none;
	overflow: visible;
	margin: 0;
	padding: 0;
}

.radial-menu-container[open="false"] {
	transition-delay: 0.3s !important;
}

.radial-menu-center {
	pointer-events: all;
	position: absolute;
	background: none !important;
	box-shadow: none !important;
	border: none !important;
	transition: background 0.2s ease;
	cursor: pointer;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	transform-origin: top left;
	animation: fade-in 0.2s ease;
	transition: opacity 0.05s ease;
	opacity: 0.5;
	margin: 0;
	padding: 0;
}

.radial-menu-center:hover:not(:active):not(.pressed),
.radial-menu-center:focus:not(:active):not(.pressed) {
	.center-image {
		scale: 1.2;
	}
}

.radial-menu-center:hover,
.radial-menu-center:focus,
.radial-menu-center:active,
.radial-menu-container[open="true"]>.radial-menu-center {
	opacity: 1 !important;
	transition-delay: 0s;
}

.center-image {
	pointer-events: none;
	height: 100% !important;
	width: 100% !important;
	position: absolute;
	top: -50%;
	left: -50%;
	transform: translate(50%, 50%);
	border: none !important;
	transition: filter 0.05s, scale 0.05s ease;
	transform-origin: bottom right;
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
	position: relative;
	pointer-events: none;
	top: 50%;
	left: 50%;
	transform-origin: top left;
	transform: translate(-50%, -50%);
	overflow: visible;
}

.submenu-button {
	will-change: transform;
	position: absolute;
	display: block;
	background: none !important;
	border: none !important;
	box-shadow: none !important;
	cursor: pointer;
	pointer-events: all;
	opacity: 0.9;
	transition-property: all !important;
	transition-duration: 0.2s !important;
	transition-timing-function: cubic-bezier(0, 0, .64, 1) !important;
	width: 30px !important;
	height: 30px !important;
	top: 50%;
	left: 50%;
	translate: -50% -50%;
}

.radial-menu-container:not(.pressed)[open="true"] {

	.submenu-group:not(:focus-within) .submenu-button:hover,
	.submenu-button:focus:not(:active) {
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
		}
	}
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

	33% {
		transform: rotate(4deg);
	}

	66% {
		transform: rotate(-6deg);
	}

	100% {
		transform: rotate(0deg);
	}
}

.button-image {
	position: absolute;
	margin: 0;
	top: 0;
	left: 0;
	translate: -50%, -50%;
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
	opacity: 0;
}
</style>
