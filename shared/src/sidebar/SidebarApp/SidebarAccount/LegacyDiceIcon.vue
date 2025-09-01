<script setup lang="ts">
import legacyDiceIcon from '#/../assets/d20-legacy.webp?inline';
</script>

<template>
	<img
		:src="legacyDiceIcon"
		data-tooltip="Legacy"
	>
</template>

<style scoped>
img {
	width: 16px;
	height: 16px;
	transition: filter 0.1s ease-in-out;
	&:hover {
		filter: drop-shadow(0 0 4px #6633cc);
	}
}
</style>
