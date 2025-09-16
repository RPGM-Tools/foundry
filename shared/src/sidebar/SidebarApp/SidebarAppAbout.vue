<script setup lang="ts">
import { Converter } from 'showdown';

import About from '##/assets/about.md?url';

import { useTitle } from '..';

useTitle()('About RPGM Tools');

const aboutText = await fetch(About).then(r => r.text()); 
const aboutHtml = new Converter().makeHtml(aboutText);
</script>

<template>
	<NCard>
		<p v-html="aboutHtml" />
	</NCard>
</template>
