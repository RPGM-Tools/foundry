<script setup lang="ts">
import StaggeredTransitionGroup from '#/util/StaggeredTransitionGroup';
import WriteOnTransition from '#/util/WriteOnTransition.vue';

import RpgmSidebarAppButton from './RpgmSidebarAppButton.vue';

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
</script>

<template>
	<div class="rpgm-sidebar-window" :data-submenu="activeMenu?.id || undefined">
		<span class="sidebar-title">
			<WriteOnTransition appear :duration="400">
				<h1 :key="activeTitle">{{ activeTitle }}</h1>
			</WriteOnTransition>
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

<style scoped>
.rpgm-sidebar-window {
	height: 100%;
	display: flex;
	flex-direction: column;

	.sidebar-title {
		width: 100%;
		z-index: 10;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
		justify-content: center;
		margin-top: 1rem;
		padding-bottom: 8px;

		h1 {
			text-align: center;
			font-size: 2rem;
			margin: 0;
		}

	}

	.sidebar-content {
		max-height: 100%;
		scrollbar-gutter: stable;
		position: relative;
		overflow-y: scroll;
		overflow-x: hidden;
		padding: 2px;

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

.rpgm-sidebar-window[data-submenu] .sidebar-title .sidebar-back {
	opacity: 1;
	visibility: visible;
	transform: translateX(0) scale(1, 1);

}

.rpgm-sidebar-window[data-submenu] .sidebar-title .sidebar-back:hover {
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
