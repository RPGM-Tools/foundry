<script setup lang="ts" generic="T extends { id: string; }">
import { useThrottleFn } from '@vueuse/core';

const model = defineModel<T | undefined>({ 
	required :true,
	set: (v) => {
		return options[getIndex(v?.id || '')];
	} 
});

const { options } = defineProps<{
	options: T[]
}>();

const getIndex = (id: string) => {
	const index = options.findIndex(o => o.id === id);
	if (index === -1) {
		return 0;
	}
	return index;
};

const isOpen = ref(false);
const selectedIndex = ref(getIndex(model.value?.id || ''));

watch(isOpen, (v) => {
	if (!v) {
		model.value = options[selectedIndex.value];
	}
}, { immediate: true });

const scroll = useThrottleFn((e: WheelEvent) => {
	if (!isOpen.value) return;
	if (e.deltaY > 0) {
		selectedIndex.value = Math.min(selectedIndex.value + 1, options.length - 1);
	} else if (e.deltaY < 0) {
		selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
	}
}, 50);

const selectIcon = (index: number) => {
	if (!isOpen.value) {
		isOpen.value = true;
		return;
	}
	if (index === selectedIndex.value) {
		isOpen.value = false;
		return;
	};
	selectedIndex.value = index;

	setTimeout(() => {
		isOpen.value = false;
	}, 300);
};

const floating = useTemplateRef('floating');

const keydown = (e: KeyboardEvent) => {
	if (e.key === ' ' || e.key === 'Enter') {
		isOpen.value = !isOpen.value;
	} else if (e.key === 'ArrowDown') {
		incrementIndex(1);
	} else if (e.key === 'ArrowUp') {
		incrementIndex(-1);
	} else { return; }
	e.preventDefault();
	e.stopPropagation();
	floating.value?.focus();
};

const incrementIndex = (i: number) => {
	if (!isOpen.value) return;
	selectedIndex.value = Math.min(options.length - 1, Math.max(0, selectedIndex.value + i));	
};
</script>

<template>
	<div>
		<div
			class="model-switcher"
			:style="{zIndex: isOpen ? 2 : 1}"
		>
			<ul
				ref="floating"
				class="floating"
				tabindex="0"
				:data-open="isOpen"
				@focusout.self="isOpen = false"
				@wheel.prevent="scroll"
				@keydown="keydown"
			>
				<li
					v-for="(o, i) in options"
					:key="o.id"
					class="icon"
					:data-selected="i === selectedIndex"
					:style="{
						opacity: isOpen ? 1 : i === selectedIndex ? 1 : 0,
						visibility: isOpen ? 'visible' : i === selectedIndex ? 'visible' : 'hidden',
						// Linear interpolation between 0.75 and 1, scaled by the distance from the selected icon
						'--scale': i === selectedIndex ? !isOpen ? 1 : 0.9 : 0.8,
						'--translateY': isOpen ? `${(i - selectedIndex) * 60}px` : `${(i - selectedIndex) * 24}px`,
						// Delay is based on the distance from the selected icon, inverted if not open
					}"
					@click="selectIcon(i)"
				>
					<slot
						name="default"
						:value="o"
						:is-open
						:selected="i === selectedIndex"
					/>
				</li>
				<div
					v-if="$slots.socket"
					class="socket"
				>
					<slot name="socket" />
				</div>
			</ul>
		</div>
	</div>
</template>

<style scoped>
.model-switcher {
	height: 48px;
	width: 48px;
	aspect-ratio: 1;
	position: fixed;
}

.floating {
	margin: 0;
	padding: 0;
	list-style: none;
	outline: none;
	height: 100%;
	width: 100%;
	position: absolute;
	z-index: 99;
	display: flex;
	flex-direction: column;
	overflow: visible;
}

.icon {
	position: absolute;
	width: 100%;
	height: 100%;
	transition: all 0.2s ease-out;
	scale: var(--scale);
	transform: translateY(var(--translateY));
	filter: drop-shadow(0 0 2px rgb(0 0 0 / 50%)) brightness(1);
	&[data-selected="false"] {
		filter: drop-shadow(0 0 2px rgb(0 0 0 / 50%)) brightness(0.9);
	}
}

.floating:focus>.icon[data-selected="true"] {
	filter: brightness(1.2);	
}

.floating[data-open="false"] .socket {
	opacity: 0;	
}
.socket {
	width: 100%;
	height: 100%;
	pointer-events: none;
	filter: brightness(0);
	opacity: 0;
	z-index: -1;
	scale: 1.1;
	transition: all 0.2s ease-out;
}

.floating[data-open="true"]>.socket {
	opacity: 0.5;
}

.floating[data-open="true"]>[data-selected="true"] {
	filter: brightness(1.2);
}
</style>
