<template>
	<div v-if="Items.length > 0" @focusout="focusOut" class="radial-menu-container" ref="root" :open="isOpen"
		:style="[rootStyle, radialFloater.floatingStyles.value]">
		<button class="radial-menu-center" ref="center" :style="{ width: `${centerSize}px`, height: `${centerSize}px` }"
			:class="{ pressed: centerPressed }" @keydown.space="centerPressed = true" @keyup.space="centerPressed = false"
			@click.prevent="toggleOpen">
			<img :class="{ loading: menuContext.loading }" :src="diceImage" class="center-image">
		</button>

		<div class="submenu-group">
			<DiceButton v-for="(button, index) in Items" @click="onSubClick" :key="button.callback.toString()"
				:item="menuContext" :button :index :style="buttonStyle[index]" rotation="random" :tabindex="isOpen ? 0 : -1" />
		</div>
	</div>
</template>

<script setup lang="ts">
import DiceButton from './DiceButton.vue';
import type { StyleValue } from 'vue';
import { autoUpdate, offset, useFloating } from '@floating-ui/vue';
import diceImage from '../../assets/d20-128x128.png';
import { shift } from '@floating-ui/vue';

const ANIMATION_DURATION = 0.2;
const MAX_CENTER_SIZE = 35;

const items = inject<RadialButton<ButtonContext>[]>('items', []);
const menuContext = inject<ButtonContext>('context') as ButtonContext;

// States for menu open/close and hover
const isOpen = ref(false);
const centerPressed = ref(false);
const root = useTemplateRef('root');
const center = useTemplateRef('center');

const Items = computed(() => {
	// Update items each time the menu is opened 
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	isOpen.value;
	return items.filter(value => value.detective(menuContext));
});

const anchor = computed((): 'right' | 'right-start' => {
	// If element has multiple lines, anchor to right-start
	if (menuContext.element instanceof HTMLInputElement) {
		return 'right';
	} else if (menuContext.element instanceof HTMLTextAreaElement) {
		return menuContext.element.rows > 1 ? 'right-start' : 'right';
	}
	return 'right-start';
});

/** Expand radial menu when open, used for overflow protection */
const rootStyle = computed(() => ({
	width: `${isOpen.value ? radius.value * 2 + centerSize.value : 30}px`,
	height: `${isOpen.value ? radius.value * 2 + centerSize.value : 30}px`,
}));

/* 
_updateSize is a hack to fix the radial menu not updating
its dimensions when its parent input element becomes visible
*/
const _updateSize = ref(0);
onMounted(() => {
	new ResizeObserver(() => setTimeout(() => { _updateSize.value++; radialFloater.update(); }, 1)).observe(menuContext.element);
});

const centerSize = computed(() => {
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	_updateSize.value;
	return Math.min(menuContext.element.scrollHeight, MAX_CENTER_SIZE);
});

const padding = () =>
	offset(() => {
		const padding = parseInt(document.defaultView?.getComputedStyle(menuContext.element).padding || '0');
		return {
			mainAxis: -padding / 2,
			crossAxis: anchor.value === 'right-start' ? padding / 2 : 0,
		};
	});

const widthOffset = () =>
	offset(({ rects }) => {
		return {
			// Keep the menu in the top right
			mainAxis: anchor.value === 'right-start' ? -rects.floating.width / 2 - centerSize.value / 2 : -rects.floating.width / 2 - centerSize.value / 2,
			crossAxis: anchor.value === 'right-start' ? -rects.floating.height / 2 + centerSize.value / 2 : 0,
		};
	});

const radialFloater = useFloating(toRef(menuContext.element), root, {
	placement: anchor.value,
	middleware: [
		padding(),
		widthOffset(),
		shift({ crossAxis: true, boundary: document.body, altBoundary: true, rootBoundary: 'document' }),
	],
	whileElementsMounted(reference, floating, update) {
		return autoUpdate(reference, floating, update, { animationFrame: true });
	},
});

function onSubClick() {
	isOpen.value = false;
	center.value?.blur();
}

function toggleOpen() {
	if (menuContext.loading) return;
	isOpen.value = !isOpen.value;
	center.value?.focus();
	// Fix overlap of subsequent radial menus
	if (root.value?.parentElement)
		root.value.parentElement.style.zIndex = isOpen.value ? "999" : "99";
}

function focusOut(event: FocusEvent) {
	if (root.value?.contains(event.relatedTarget as HTMLElement)) return;
	isOpen.value = false;
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

function getSubButtonStyle(index: number): StyleValue {
	const itemCount = Items.value.length;
	const anglePerItem = 360 / itemCount;
	const angle = index * anglePerItem - 45;
	const radians = (Math.PI / 180) * angle;

	// Calculate the radius from how many items such that they don't overlap
	// Final X, Y offset if open
	const finalX = Math.cos(radians) * radius.value;
	const finalY = Math.sin(radians) * radius.value;

	/** Stagger delay to collectively take {@link ANIMATION_DURATION}
	Reverse the delay if closing */
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
.radial-menu-container {
	transition: width 0.2s ease, height 0.2s ease !important;
	pointer-events: none;
	overflow: visible;
	margin: 0;
	padding: 0;
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
	filter: drop-shadow(2px 2px 2px #00000044);
	margin: 0 !important;
}

.radial-menu-center:hover>.center-image,
.radial-menu-center:focus>.center-image {
	filter: drop-shadow(2px 2px 2px #6633ccaa);
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
