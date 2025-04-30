<script setup lang="ts">
import { ForgeDescription } from '@rpgm/forge';

const message = inject<ChatMessage>("message")!;
const data = reactive(rpgm.forge!.getDescription(message.id!)!);
const loading = ref(false);

async function generate(regenerate: boolean) {
	loading.value = true;
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
	rpgm.chat.updateScroll(undefined, !regenerate);
	loading.value = false;
}

function copy() {
	try {
		void navigator.clipboard.writeText(data.description);
		rpgm.forge!.logger.logU("Copied description to clipboard!");
	} catch { return; }
}

onMounted(() => {
	if (!data.description) void generate(false);
});
</script>

<template>
	<h3>{{ data.name ? `${data.name} - ` : "" }}{{ data.type }}</h3>
	<Transition name="rpgm-forge-description">
		<p v-if="data.description" class="rpgm-forge-description">{{ data.description }}</p>
	</Transition>
	<button class="rpgm-button" @click="copy">Copy to Clipboard</button>
	<button :disabled="loading" class="rpgm-button" @click="generate(true)">Regenerate</button>
</template>

<style>
.rpgm-forge-description {
	list-style: none;
	position: relative;
	transition-property: all;
	transition-duration: 750ms;
	transition-timing-function: ease;
	max-height: 300px;
	overflow: scroll;
	margin: 0 !important;
}

.rpgm-forge-description-leave-active,
.rpgm-forge-description-enter-active {
	scrollbar-width: none;
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
	left: 0px;
}
</style>
