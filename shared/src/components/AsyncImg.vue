<script setup lang="ts">
const { src } = defineProps<{ src: string }>();

async function load(src: string) {
	return new Promise<string>((resolve, reject) => {
		const img = new Image();
		img.src = src;
		img.onload = () => resolve(src);
		img.onerror = reject;
	});
}

const loadedSrc = await load(src);
</script>

<template>
	<img :src="loadedSrc">
</template>
