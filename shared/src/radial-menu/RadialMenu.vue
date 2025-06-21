<template>
	<Transition name="radial-menu-fade">
		<div v-if="Items.length > 0" ref="root" class="radial-menu-container" :open="isOpen"
			:style="Items.length > 1 ? [rootStyle, radialFloater.floatingStyles.value] : ''" @focusout="focusOut">
			<template v-if="Items.length > 1">
				<button ref="center" :disabled="menuContext.loading" class="radial-menu-center"
					:style="{ width: `${centerSize}px`, height: `${centerSize}px` }" :class="{ pressed: centerPressed }"
					@keydown.space="centerPressed = true" @keyup.space="centerPressed = false" @click.prevent.stop="toggleOpen">
					<img :class="{ loading: menuContext.loading }" :src="diceImage" class="center-image">
				</button>

				<div class="submenu-group">
					<DiceButton v-for="(button, index) in Items" :key="button.callback.toString()" v-model="menuContext" :button
						:index :style="buttonStyle[index]" rotation="random" :tabindex="isOpen ? 0 : -1" @click="onSubClick" />
				</div>
			</template>
			<DiceButton v-else v-model="menuContext" :button="Items[0]" />
		</div>
	</Transition>
</template>

<script setup lang="ts">
import DiceButton from './DiceButton.vue';
import type { StyleValue } from 'vue';
import { autoUpdate, offset, useFloating } from '@floating-ui/vue';
import diceImage from '../../assets/d20-512x512.webp';
import { shift } from '@floating-ui/vue';

const ANIMATION_DURATION = 0.2;
const MAX_CENTER_SIZE = 35;

const menuContext = defineModel<ButtonContext>({ required: true });

const { buttons, padDocument = true, top = false, right = false, padding = { top: 0, right: 0 } } = defineProps<{
	buttons: RadialButton[]
	top?: boolean
	right?: boolean
	padDocument?: boolean
	padding?: { top: number, right: number }
}>();

// States for menu open/close and hover
const open = ref(false);
const isOpen = computed(() => Items.value.length == 1 || open.value);
const centerPressed = ref(false);
const root = useTemplateRef('root');
const center = useTemplateRef('center');

const observer = ref(new ResizeObserver(() => setTimeout(() => { _updateSize.value++; radialFloater.update(); }, 1)));
watch(() => menuContext.value.element, (e) => {
	observer.value?.observe(e);
}, { immediate: true });

const Items = computed(() => {
	// Update buttons each time the menu is opened 
	open.value = Boolean(open.value);
	return buttons.filter(value => value.detective ? value.detective(menuContext.value) : true);
});

const anchor = computed((): 'right' | 'right-start' => {
	// If element has multiple lines, anchor to right-start
	if (menuContext.value.element instanceof HTMLInputElement) {
		return 'right';
	} else if (menuContext.value.element instanceof HTMLTextAreaElement) {
		return menuContext.value.element.rows > 1 ? 'right-start' : 'right';
	}
	return 'right-start';
});

/** Expand radial menu when open, used for overflow protection */
const rootStyle = computed(() => ({
	width: `${isOpen.value ? radius.value * 1.7 + centerSize.value : 30}px`,
	height: `${isOpen.value ? radius.value * 1.7 + centerSize.value : 30}px`,
}));

/* 
_updateSize is a hack to fix the radial menu not updating
its dimensions when its parent input element becomes visible
*/
const _updateSize = ref(0);

const centerSize = computed(() => {
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	_updateSize.value;
	return Math.min(menuContext.value.element.scrollHeight, MAX_CENTER_SIZE);
});

const paddingOffset = () =>
	offset(() => {
		const style = document.defaultView!.getComputedStyle(menuContext.value.element);
		const _padding = parseInt(style.padding || '0');
		const _margin = parseInt(style.margin || '0');
		return {
			mainAxis: -(_padding + _margin + padding.right) / 2,
			crossAxis: anchor.value === 'right-start' ? (_padding + _margin + padding.top) / 2 : 0,
		};
	});

const widthOffset = () =>
	offset(({ rects }) => {
		return {
			// Keep the menu in the top right
			mainAxis: !right ? -rects.floating.width / 2 - centerSize.value / 2 : -rects.floating.width,
			crossAxis: !top && anchor.value === 'right-start' ?
				-rects.floating.height / 2 + centerSize.value / 2 : 0
		};
	});

const radialFloater = useFloating(toRef(menuContext.value.element), root, {
	placement: anchor.value,
	middleware: [
		paddingOffset(),
		widthOffset(),
		...padDocument ? [shift({ crossAxis: true, boundary: document.body, altBoundary: true, rootBoundary: 'document' })] : [],
	],
	whileElementsMounted(reference, floating, update) {
		return autoUpdate(reference, floating, update, { ancestorScroll: true });
	},
});

/** Close radial menu */
function onSubClick() {
	open.value = false;
	center.value?.blur();
}

/** Toggle radial menu */
function toggleOpen() {
	if (menuContext.value.loading) return;
	open.value = !isOpen.value;
	center.value?.focus();
	radialFloater.update();
	// Fix overlap of subsequent radial menus
	if (root.value?.parentElement)
		root.value.parentElement.style.zIndex = isOpen.value ? "999" : "99";
}

/**
 * Ignore focus changes within the radial menu, else close the menu
 * @param event - The {@link FocusEvent} to detect the target of blur
 */
function focusOut(event: FocusEvent) {
	if (root.value?.contains(event.relatedTarget as HTMLElement)) return;
	open.value = false;
}

/**
 * Compute the style for each sub-button, including:
 * - The angle at which it’s placed (between startAngle and endAngle)
 * - The radial animation transform
 * - A stagger delay based on the button index
 */
const buttonStyle = computed(() => {
	return Items.value.map((_, index) => getSubButtonStyle(index));
});

const radius = computed(() => {
	return Math.max(centerSize.value * 1.25, centerSize.value / Math.sin(2 * Math.PI / Math.max(3, Items.value.length)));
});

/**
 * @param index - The index of the button to style
 * @returns The rotation effect for this button
 */
function getSubButtonStyle(index: number): StyleValue {
	const itemCount = Items.value.length;
	const anglePerItem = 360 / itemCount;
	const angle = index * anglePerItem - 45;
	const radians = (Math.PI / 180) * angle;

	// Calculate the radius from how many buttons such that they don't overlap
	// Final X, Y offset if open
	const finalX = Math.cos(radians) * radius.value;
	const finalY = Math.sin(radians) * radius.value;

	/**
	 * Stagger delay to collectively take {@link ANIMATION_DURATION}
	 * Reverse the delay if closing
	 */
	const staggerDelay = (ANIMATION_DURATION / itemCount) * (isOpen.value ? index : itemCount - index);

	// If open => transform to final position with scale(1)
	// If not => scale(0) at the center
	const transform = isOpen.value
		? `rotate(0deg) translate(${finalX}px, ${finalY}px) rotate(0deg) scale(1)`
		: `rotate(-90deg) translate(0px, 0px) rotate(-180deg) scale(0)`;

	return {
		scale: Number(isOpen.value),
		transform,
		opacity: isOpen.value ? 1 : 0,
		transitionDelay: `${staggerDelay}s`,
		transitionTimingFunction: isOpen.value ? "cubic-bezier(0, 0, .4, 1)" : "cubic-bezier(.4, 0, 1, 1)",
	};
}

</script>

<style>
.radial-menu-fade-enter-to,
.radial-menu-fade-leave-from {
	opacity: 1;
}

.radial-menu-fade-leave-to,
.radial-menu-fade-enter-from {
	opacity: 0;
}

.radial-menu-container {
	transition: width 0.2s ease, height 0.2s ease, opacity 0.2s !important;
	pointer-events: none;
	overflow: visible;
	margin: 0;
	padding: 0;
	z-index: 1;
}

#chat-notifications:has(.radial-menu-container[open="true"]),
#chat-notifications:has(.radial-menu-container:active),
#chat-notifications:has(.radial-menu-container:focus-within) {
	.chat-input {
		height: var(--chat-input-height);
	}
}

.radial-menu-container[open="false"] {
	transition-delay: 0.2s !important;

	.radial-menu-tooltip {
		opacity: 0 !important;
	}
}

.radial-menu-center {
	pointer-events: all;
	position: absolute;
	background: none !important;
	border: none !important;
	transition-property: background opacity;
	transition-duration: 0.2s 0.05s;
	transition-timing-function: ease ease;
	cursor: pointer;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	transform-origin: top left;
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
	border: none !important;
	transition: filter 0.1s, scale 0.1s ease !important;
	filter: drop-shadow(2px 2px 0px #00000044);
	margin: 0 !important;
}

.radial-menu-center:hover>.center-image,
.radial-menu-center:focus>.center-image {
	filter: drop-shadow(0px 0px 2px #6633cc);
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

.loading {
	animation: jitter 0.5s infinite;
	animation-delay: v-bind('`${ANIMATION_DURATION}s`');
}

@keyframes jitter {
	0% {
		transform: translate(1px, 1px) rotate(0deg);
	}

	10% {
		transform: translate(-1px, -2px) rotate(-3deg);
	}

	20% {
		transform: translate(-3px, 0px) rotate(3deg);
	}

	30% {
		transform: translate(3px, 2px) rotate(0deg);
	}

	40% {
		transform: translate(1px, -1px) rotate(3deg);
	}

	50% {
		transform: translate(-1px, 2px) rotate(-3deg);
	}

	60% {
		transform: translate(-3px, 1px) rotate(0deg);
	}

	70% {
		transform: translate(3px, 1px) rotate(-3deg);
	}

	80% {
		transform: translate(-1px, -1px) rotate(3deg);
	}

	90% {
		transform: translate(1px, 2px) rotate(0deg);
	}

	100% {
		transform: translate(1px, -2px) rotate(-3deg);
	}
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
</style>
