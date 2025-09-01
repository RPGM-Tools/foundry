<script setup lang="ts">
import RadialMenu from './RadialMenu.vue';

const buttons = inject<RadialButton[]>('buttons') as RadialButton[];
const menuContext = inject<ButtonContext>('context') as ButtonContext;

</script>

<template>
	<RadialMenu v-model="menuContext" :buttons />
</template>
