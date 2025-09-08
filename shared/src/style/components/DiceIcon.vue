<script setup lang="ts">
import { useThemeVars } from 'naive-ui';
import type { ImgHTMLAttributes } from 'vue';

import d20Icon from '##/assets/d20-512x512.webp?url';
import d20Checked from '##/assets/d20-checked.webp?url';
import d20Error from '##/assets/d20-error.webp?url';
import d20Offline from '##/assets/d20-offline.webp?url';
import d20Warning from '##/assets/d20-warning.webp?url';

const theme = useThemeVars();

interface DiceButtonProps extends /* @vue-ignore */ ImgHTMLAttributes {
	type?: 'rpgm' | 'success' | 'warning' | 'error' | 'offline',
}

const { type = 'rpgm' } = defineProps<DiceButtonProps>();

defineOptions({
	inheritAttrs: false	
});

const src = computed(() => {
	switch (type) {
		case 'rpgm': return d20Icon;
		case 'success': return d20Checked;
		case 'warning': return d20Warning;
		case 'error': return d20Error;
		case 'offline': return d20Offline;
		default: return d20Icon;
	}
});

const color = computed(() => {
	switch (type) {
		case 'rpgm': return theme.value.primaryColor;
		case 'success': return theme.value.successColor;
		case 'warning': return theme.value.warningColor;
		case 'error': return theme.value.errorColor;
		case 'offline': return theme.value.baseColor;
		default: return theme.value.primaryColor;
	}
});

const dropShadow = computed(() => `drop-shadow(0 0 2px ${color.value})`);
</script>

<template>
	<img :src>
</template>

<style scoped>
img {
	transition: all 100ms ease-out;
}

img:hover {
	filter: v-bind(dropShadow);
}
</style>
