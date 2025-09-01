<!-- A large menu button to access a submenu -->
<script setup lang="ts">
import type { RouteRecordNormalized } from 'vue-router';
const { menu } = defineProps<{
	menu: RouteRecordNormalized
}>();

defineEmits<{
	click: []
}>();
</script>

<template>
	<div
		class="sidebar-button"
		:tabindex="0"
		@keydown.space.prevent="$emit('click')"
		@click="$emit('click')"
	>
		<span class="sidebar-inner-button">
			<i
				class="sidebar-button-icon"
				:class="menu.meta.menu!.icon"
			/>
			<span class="sidebar-button-title">
				{{ menu.meta.title }}
			</span>
			<i class="fas fa-chevron-right sidebar-button-icon sidebar-chevron" />
		</span>
	</div>
</template>

<style scoped>
.sidebar-button {
	--sidebar-button-color: v-bind(menu.meta.menu.color);
	width: 100%;
	cursor: pointer;
	padding: 1.5rem 1.5rem;
	margin: 1rem;
	border-radius: 100vmax;
	border: 1px solid var(--sidebar-button-color);
	background: rgb(from var(--sidebar-button-color) r g b / 0.5);
	background-size: 400% 400%;
	background-repeat: no-repeat;
	transition: background 0.3s ease-out, box-shadow 0.2s ease-out, border 0.3s ease-out;
	background-position: 100% 10%, 10% 100%;
	overflow: hidden;
	display: flex;
	user-select: none;
	outline: none;
}

.sidebar-inner-button {
	display: inline-flex;
	flex: 1;
	align-items: center;
	gap: 0.5rem;
	font-size: 2rem;
	padding: 2px;
}

.sidebar-button:focus,
.sidebar-button:hover {
	background-position: 70% 10%, 10% 40%;
	background: rgb(from var(--sidebar-button-color) r g b / 0.7);
	border: 1px solid color-mix(in srgb, var(--sidebar-button-color), white 20%);
	box-shadow: 0px 0px 10px color-mix(in srgb, var(--sidebar-button-color), white 20%) !important;

	.sidebar-chevron {
		opacity: 1;
		transform: translateX(0) scaleY(1);
	}
}

.sidebar-chevron {
	opacity: 0;
	transform: translateX(150%) scaleY(0);
	transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sidebar-button-title {
	text-align: left;
	font-weight: bold;
	/* font-size: 2rem; */
	padding: 0.5rem 0;
	color: #fff;
	flex: 1;
}

.sidebar-button-icon {
	/* font-size: 2rem; */
	color: #fff;
}
</style>
