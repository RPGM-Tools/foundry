<script setup lang="ts">
import { useRouter } from 'vue-router';

import StaggeredTransitionGroup from '#/util/StaggeredTransitionGroup';

import SidebarAppButton from './SidebarAppButton.vue';

const router = useRouter();

const menus = computed(() => router.getRoutes()
	.filter(route => route.meta.menu)
	.sort((a, b) => (b.meta.menu!.index || 0) - (a.meta.menu!.index || 0)));
</script>

<template>
	<StaggeredTransitionGroup
		appear
		tag="ul"
		name="rpgm-zoom"
	>
		<li
			v-for="menu in menus"
			:key="menu.path"
		>
			<SidebarAppButton
				:menu
				@click="$router.push(menu.path)"
			/>
		</li>
	</StaggeredTransitionGroup>
</template>

<style scoped>
	ul {
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
</style>
