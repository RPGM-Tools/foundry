<script setup lang="ts">
import { ForgeDescription } from '@rpgm/forge';

import ChatWizardContainer from '#/chat/ChatWizardContainer.vue';

const description = rpgm.forge.descriptionsChats.useChatWizard(), { data } = description;
const loading = ref(false);

/**
 * Generates the description.
 * @todo Less hardcoding
 */
async function generate() {
	loading.value = true;
	const oldDesc = data.description;
	data.description = "";

	const result = await rpgm.forge.queue.generate(ForgeDescription, {
		name: data.name ?? "",
		type: data.type,
		system: rpgm.forge.system,
		language: rpgm.forge.language,
		genre: rpgm.forge.genre,
		length: 'short',
		notes: ''
	});

	if (!result.success) rpgm.forge.logger.visible.error(result.error);

	data.description = result.success ? result.output : oldDesc;
	rpgm.chat.updateScroll();
	loading.value = false;
}

const buttons: RadialButton<ButtonContext>[] = [
	{
		category: rpgm.radialMenu.categories.rpgm_forge,
		callback: copy,
		detective: () => secure,
		icon: "fa fa-copy",
		tooltip: "RPGM_FORGE.RADIAL_MENU.COPY",
	},
	{
		category: rpgm.radialMenu.categories.rpgm_forge,
		callback: generate,
		icon: "fa fa-refresh",
		tooltip: "RPGM_FORGE.RADIAL_MENU.REGENERATE",
	}
];

/**
 * Copies the description to clipboard.
 */
function copy() {
	try {
		void navigator.clipboard.writeText(`# ${data.name ? `${data.name} – ` : ''}${data.type}\n${data.description}`);
		rpgm.forge.logger.visible.log("Copied description to clipboard!");
	} catch { return; }
}

onMounted(() => {
	if (!data.description && !loading.value) void generate();
});

const secure = window.isSecureContext;
</script>

<template>
	<ChatWizardContainer :wizard="description" :buttons>
		<h2>{{ data.name ? `${data.name} – ` : "" }}{{ data.type }}</h2>
		<Transition name="forge-description">
			<p v-if="data.description" ref="content" tabindex="0" class="forge-description">{{ data.description }}</p>
		</Transition>
	</ChatWizardContainer>
</template>

<style>
.forge-description {
	list-style: none;
	position: relative;
	transition-property: all;
	transition-duration: 750ms;
	transition-timing-function: ease;
	max-height: 300px;
	overflow-y: scroll;
	user-select: text;
	margin: 0 !important;
	cursor: text;
}

.forge-description-leave-active,
.forge-description-enter-active {
	scrollbar-width: none;
}

.forge-description-enter-from,
.forge-description-leave-to {
	opacity: 0;
	max-height: 0;
	left: -10px;
}

.forge-description-enter-to,
.forge-description-leave-from {
	opacity: 1;
	left: 0px;
}
</style>
