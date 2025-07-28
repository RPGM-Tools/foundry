<!-- A large menu button to access a submenu -->
<script setup lang="ts">
const { menu } = defineProps<{
	menu: SidebarMenu
}>();

defineEmits<{
	click: []
}>();
</script>

<template>
	<div class="sidebar-button" :style="{ pointerEvents: menu.component ? 'auto' : 'none' }" :tabindex="0"
		@click="$emit('click')">
		<span class="sidebar-inner-button">
			<i class="sidebar-button-icon" :class="menu.icon" />
			<span class="sidebar-button-title">
				{{ menu.title }}
			</span>
			<i class="fas fa-chevron-right sidebar-button-icon sidebar-chevron" />
		</span>
	</div>
</template>

<style scoped>
.sidebar-button {
	--sidebar-button-color: v-bind(menu.color);
	width: 100%;
	cursor: pointer;
	padding: 1.5rem 1.5rem;
	margin: 1rem;
	border-radius: 2rem;
	border: 1px solid hsl(from var(--sidebar-button-color) h s l);
	background: radial-gradient(circle, var(--sidebar-button-color) 0%, rgba(255, 255, 255, 0) 100%),
		radial-gradient(circle, var(--sidebar-button-color) 0%, rgba(255, 255, 255, 0) 100%);
	background-size: 400% 400%;
	background-repeat: no-repeat;
	transition: background 0.3s ease-out, box-shadow 0.2s ease-out;
	background-position: 100% 10%, 10% 100%;
	overflow: hidden;
	display: flex;
}

.sidebar-inner-button {
	display: inline-flex;
	flex: 1;
	align-items: center;
	gap: 0.5rem;
	font-size: 2rem;
	padding: 2px;
}

.sidebar-button:hover {
	background-position: 70% 10%, 10% 40%;
	box-shadow: 0px 0px 10px var(--sidebar-button-color) !important;

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
