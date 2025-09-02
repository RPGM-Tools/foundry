<script setup lang="ts">
import { useElementVisibility } from '@vueuse/core';
import { RouterView } from 'vue-router';

import { NaiveTheme } from '#/style/theme';
import { vFitLines } from '#/util/VFitLines';
import WriteOn from '#/util/WriteOn';

// import WriteOnTransition from '#/util/WriteOnTransition.vue';
import PolyhedriumBalance from './PolyhedriumBalance.vue';

// Takes a ref that returns true once its inner value has been true at least once
function lockTrue(input: Ref<boolean>) {
	const isTrue = ref<boolean>(false);
	watch(input, (value) => {
		if (value) {
			isTrue.value = true;
		}
	}, { immediate: true });
	return isTrue;
}

const root = useTemplateRef('root');
const visible = useElementVisibility(root);
const shouldShow = lockTrue(visible);

const onResize = inject<(forceCenter?: boolean) => void>('onResize');

const { updateBalance } = rpgm.usePolyhedriumBalance();

watch(visible, (v) => {
	if (v) {
		updateBalance();
	}
});

function focus() {
	root.value?.focus();
	onResize?.(true);
}

onMounted(() => {
	setTimeout(focus, 100);
});
</script>

<template>
	<div
		ref="root"
		tabindex="0"
		class="rpgm-app static rpgm-sidebar-window"
		@keydown.meta.left.prevent="$router.back"
	>
		<NaiveTheme>
			<span class="sidebar-title-container">
				<PolyhedriumBalance
					style="position: absolute; right: 0; top: 50%; transform: translateY(-50%);"
					align="right"
				/>
				<WriteOn
					v-fit-lines
					class="sidebar-title"
					:value="$route.meta.title ?? ''"
					:duration="400"
				/>
				<i
					:class="{ 'hide-sidebar-back': $route.path === '/' }"
					tabindex="0"
					class="fas fa-chevron-left sidebar-back"
					@click="$router.back"
					@keydown.space.prevent="$router.back"
					@keydown.enter.prevent="$router.back"
				/>
			</span>
			<div
				v-if="shouldShow"
				class="sidebar-content"
			>
				<RouterView #="{ Component }">
					<Transition
						name="rpgm-fade"
						@after-enter="focus"
					>
						<component :is="Component" />
					</Transition>
				</RouterView>
			</div>
		</NaiveTheme>
	</div>
</template>

<style scoped>
.sidebar-popout .sidebar-content {
	min-height: unset !important;
	height: unset !important;
}

.rpgm-sidebar-window {
	height: 100%;
	display: flex;
	flex-direction: column;

	.sidebar-title-container {
		width: 100%;
		z-index: 10;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
		justify-content: center;
		margin-bottom: 0.4rem;

		.sidebar-title {
			text-align: center;
			font-size: 2rem;
			margin: 0;
			padding-top: 4px;
			padding-left: 2rem;
			padding-right: 2rem;
		}
	}

	.sidebar-content {
		height: 100%;
		scrollbar-gutter: stable;
		padding-left: 6px;
		position: relative;
		overflow-y: scroll;
		overflow-x: hidden;
		padding-bottom: 8px;
	}
}

.sidebar-back {
	position: absolute;
	top: 50%;
	height: 100%;
	left: 0.5rem;
	transform: translateX(0) scale(1, 1);
	translate: 0 -50%;
	font-size: 2rem;
	z-index: 1;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
	outline: none;

	&.hide-sidebar-back {
		transform: translateX(-125%) scale(1, 0);
	}

	&:not(.hide-sidebar-back):focus,
	&:not(.hide-sidebar-back):hover {
		color: #6633ff;
		text-shadow: 0 0 4px #6633ff;
		transform: translateX(25%) scale(1.25, 1);
	}
}
</style>
