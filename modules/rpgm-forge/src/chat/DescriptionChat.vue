<script setup lang="ts">
import { ForgeDescription } from '@rpgm/forge';

const message = inject<ChatMessage>("message")!;
const data = reactive(rpgm.forge!.getDescription(message.id!)!);

async function generate() {
	data.description = "";
	const options: DescriptionOptions = {
		name: data.name ?? "",
		type: data.type,
		style: 'Fantasy',
		length: 'short',
		notes: ''
	};

	const result = await ForgeDescription.fromOptions(options).generate({
		auth_token: game.settings.get("rpgm-tools", "api_key")
	});

	if (!result.success) return;

	data.description = result.output;
	rpgm.forge!.setDescription(message.id!, toRaw(data));
	rpgm.chat.updateScroll();
}

onMounted(() => {
	if (!data.description) void generate();
});
</script>

<template>
	<h3>{{ data.type }}</h3>
	<Transition name="rpgm-forge-description">
		<p v-if="data.description" class="rpgm-forge-description">{{ data.description }}</p>
	</Transition>
	<button @click="generate()">Regenerate</button>
</template>

<style>
.rpgm-forge-name-container {
	position: relative;
	margin: 0;
	padding-left: 0;
	padding-bottom: 4px;
}

.rpgm-forge-description {
	list-style: none;
	position: relative;
	transition-property: all;
	transition-duration: 750ms;
	transition-timing-function: ease;
}

.rpgm-forge-description-enter-active {
	transition-delay: 750ms !important;
}

.rpgm-forge-description-enter-from,
.rpgm-forge-description-leave-to {
	opacity: 0;
	max-height: 0;
	left: -10px;
}

.rpgm-forge-description-enter-to,
.rpgm-forge-description-leave-from {
	opacity: 1;
	max-height: 9999px;
	left: 0px;
}
</style>
