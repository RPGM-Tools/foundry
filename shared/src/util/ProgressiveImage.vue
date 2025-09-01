<script setup lang="ts">
import buttonImage from '../../assets/d20-512x512.webp?url';
import useProgressiveImage from './useProgressiveImage';

const props = defineProps<{
	src: string
}>();

const { src, blur } = useProgressiveImage(buttonImage, props.src);

</script>

<template>
	<img :src :class="{ loading: blur }">
</template>

<style scoped>
img.loading {
	filter: blur(8px);
}

img {
	transition: filter 0.5s ease-in-out;
	filter: blur(0px);
}
</style>
