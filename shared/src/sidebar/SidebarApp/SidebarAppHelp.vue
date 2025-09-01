<script setup lang="ts">
import { Converter } from 'showdown';

import Help from '../../../assets/help.md?raw';

const formattedHelp = computed(() => {
	const converter = new Converter();
	const a = converter.makeHtml(Help);

	return a;
});
</script>

<template>
	<p class="help" v-html="formattedHelp" />
</template>

<style scoped>
.help {
	white-space: pre-wrap;
}

.help *:not(ul) {
	padding: 0;
	margin: 0;
}

.divider {
	width: 100%;
	height: 1px;
	background-color: #aaa;
}
</style>
