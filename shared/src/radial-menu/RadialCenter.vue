<script setup lang="ts">
import DiceIcon from '#/style/components/DiceIcon.vue';

const pressed = ref(false);
</script>

<template>
	<component
		:is="$attrs.tag ?? 'button'"
		v-bind="$attrs"
		:data-pressed="pressed"
		class="radial-menu-center-2"
		@keydown.stop.space="pressed = true"
		@keyup.stop.space="pressed = false"
	>
		<slot>
			<DiceIcon type="rpgm" />
		</slot>
	</component>
</template>

<style scoped>
.radial-menu-center-2 {
	pointer-events: all;
	background: none !important;
	border: none !important;
	transition: all 0.1s ease;
	padding: 0 !important;
	margin: 0 !important;
	line-height: 0 !important;
	height: 100% !important;
	width: 100% !important;
}

.radial-menu-center-2:focus:not(:active):not([data-pressed='true']),
.radial-menu-center-2:hover:not(:active):not([data-pressed='true']) {
	:deep(img) {
		scale: 1.1;
		transform-origin: center;
	}
}
</style>
