<script setup lang="ts">
import { Converter } from 'showdown';

import type { HelpEntry } from '#/help';
import { useTitle } from '#/sidebar';

const { page } = defineProps<{ page: HelpEntry }>();

const contents = ref(rpgm.help.cache.get(page.url ?? ''));

const setTitle = useTitle();

onActivated(() => {
	setTitle(page.name);	
});

if (!contents.value) {
	contents.value = await rpgm.help.fetch(page.url);
	rpgm.help.cache.set(page.url, contents.value);
}
const converter = new Converter();

const html = converter.makeHtml(contents.value ?? '');
</script>

<template>
	<div
		v-if="contents"
		v-html="html"
	/>
	<div v-else>
		No help found for {{ page }}
	</div>
</template>
