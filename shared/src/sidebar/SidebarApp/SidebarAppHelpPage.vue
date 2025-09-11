<script setup lang="ts">
import { Converter } from 'showdown';
import { useRoute } from 'vue-router';

import { useTitle } from '#/sidebar';

const page = useRoute().params.page as string;

const entry = ref(rpgm.help.pages.get(page));
const contents = ref(rpgm.help.cache.get(entry.value?.url ?? ''));

if (entry.value) {
	useTitle(entry.value.name);
	if (!contents.value) {
		contents.value = await rpgm.help.fetch(entry.value.url);
		rpgm.help.cache.set(entry.value.url, contents.value);
	}
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
