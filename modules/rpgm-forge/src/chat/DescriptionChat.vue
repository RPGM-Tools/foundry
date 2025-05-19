<script setup lang="ts">
import { ForgeDescription } from '@rpgm/forge';
import DiceButton from '#/radial-menu/DiceButton.vue';

const { data } = rpgm.forge!.descriptionsChats.useChatDatabase();
const loading = ref(false);

const contentRef = useTemplateRef("content");
watch(contentRef, (c) => context.value.element = c!, { once: true });

/**
 * Generates the description
 * @todo Less hardcoding
 */
async function generate() {
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
	rpgm.chat.updateScroll();
	loading.value = false;
}

const button: RadialButton<ButtonContext> = {
	category: rpgm.radialMenu.categories.rpgm_forge,
	callback: copy,
	icon: "fa fa-copy",
	tooltip: "RPGM_FORGE.RADIAL_MENU.COPY",
};

const context = ref<ButtonContext>({
	loading: false,
	element: contentRef.value!,
	shift: false
});

/**
 * Copies the description to clipboard
 */
function copy() {
	try {
		void navigator.clipboard.writeText(data.description);
		rpgm.forge!.logger.logU("Copied description to clipboard!");
	} catch { return; }
}

onMounted(() => {
	if (!data.description && !loading.value) void generate();
});

const secure = window.isSecureContext;
</script>

<template>
	<div v-if="secure" style="max-height: 40px; position: absolute; left: 95%;">
		<DiceButton v-model="context" :index="1" :button="button" />
	</div>
	<h3>{{ data.name ? `${data.name} - ` : "" }}{{ data.type }}</h3>
	<Transition name="forge-description">
		<p v-if="data.description" ref="content" tabindex="0" class="forge-description">{{ data.description }}</p>
	</Transition>
	<button :disabled="loading" class="rpgm-button" @click="generate">Regenerate</button>
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
