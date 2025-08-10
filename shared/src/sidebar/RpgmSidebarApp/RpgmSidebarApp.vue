<script setup lang="ts">
import { useElementVisibility } from '@vueuse/core';

import StaggeredTransitionGroup from '#/util/StaggeredTransitionGroup';
import WriteOn from '#/util/WriteOn';

// import WriteOnTransition from '#/util/WriteOnTransition.vue';
import PolyhedriumBalance from './PolyhedriumBalance.vue';
import RpgmSidebarAppButton from './RpgmSidebarAppButton.vue';

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

const visible = useElementVisibility(useTemplateRef("root"));
const shouldShow = lockTrue(visible);

const onResize = inject<(forceCenter?: boolean) => void>('onResize');

const menus = rpgm.sidebar.menus;

const activeTitle = computed(() => {
	return activeMenu.value ? activeMenu.value.title : 'RPGM Tools';
});

const activeMenu = shallowRef<SidebarMenu>();

function submenuClick(menu: typeof rpgm.sidebar.menus[number]) {
	if (menu.component) {
		activeMenu.value = menu;
	}
}

function back() {
	activeMenu.value = undefined;
}

const { updateBalance } = rpgm.usePolyhedriumBalance();

watch(visible, (v) => {
	if (v) {
		rpgm.logger.log("Sidebar opened");
		updateBalance();
	}
});
</script>

<template>
	<div ref="root" class="rpgm-app rpgm-sidebar-window" :data-submenu="activeMenu?.id || undefined">
		<span v-if="shouldShow" class="sidebar-title-container">
			<PolyhedriumBalance style="position: absolute; right: 0; top: 50%; transform: translateY(-50%);" align="right" />
			<WriteOn class="sidebar-title" :value="activeTitle" :duration="400" />
			<i class="fas fa-chevron-left sidebar-back" @click="back" />
		</span>
		<div class="sidebar-content">
			<Transition name="rpgm-fade" @after-enter="onResize?.(true)">
				<StaggeredTransitionGroup v-if="!activeMenu" appear tag="ul" name="rpgm-fade">
					<li v-for="menu in menus" :key="menu.id">
						<RpgmSidebarAppButton :menu @click="submenuClick(menu)" />
					</li>
				</StaggeredTransitionGroup>
				<component :is="activeMenu.component" v-else-if="activeMenu.component" />
			</Transition>
		</div>
	</div>
</template>

<style></style>

<style scoped>
.sidebar-popout .sidebar-content {
	min-height: unset !important;
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
		}

	}

	.sidebar-content {
		/* min-height: 100%; */
		max-height: 100%;
		scrollbar-gutter: stable both-edges;
		position: relative;
		overflow-y: scroll;
		overflow-x: hidden;
		padding-bottom: 8px;

		>ul {
			display: flex;
			list-style: none;
			display: flex;
			padding: 0;
			margin: 0;
			flex-direction: column;
			justify-content: center;
			align-items: stretch;
			width: 100%;

			li {
				display: flex;
			}
		}
	}
}

.rpgm-sidebar-window[data-submenu] .sidebar-title-container .sidebar-back {
	opacity: 1;
	visibility: visible;
	transform: translateX(0) scale(1, 1);

}

.rpgm-sidebar-window[data-submenu] .sidebar-title-container .sidebar-back:hover {
	transform: translateX(25%) scale(1.25, 1)
}

.sidebar-back {
	position: absolute;
	top: 50%;
	left: 0.5rem;
	transform: translateX(-150%) scale(1, 0);
	translate: 0 -50%;
	font-size: 2rem;
	z-index: 1;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
