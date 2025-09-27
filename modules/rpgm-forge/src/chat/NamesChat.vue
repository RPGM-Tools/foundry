<script setup lang="ts">

import { RPGM_MODELS } from '@rpgm/tools/forge';

import ChatWizardContainer from '#/chat/ChatWizardContainer.vue';
import SkeletonParagraph from '#/chat/SkeletonParagraph.vue';
import { getSelectedToken, nameToken } from '$/util/token';

const NAMES_PER_GENERATION = 4;

const names = rpgm.forge.nameChats.useChatWizard(), { data } = names;
const loading = ref(false);

const insertValues = (values: string[]) => {
	values.forEach((v, i) => {
		setTimeout(() => {
			data.names.push(v);
			setTimeout(() => {
				rpgm.chat.updateScroll();
			}, 400);
		}, i * 100);
	});
};

/**
 * Generates the name.
 * @param regenerate - Whether or not to delete the old names
 * @todo Less hardcoding
 */
async function generate(regenerate: boolean = false) {
	const isLastRpgmGeneration = rpgm.forge.settings.get('namesModel').provider === 'rpgm-tools'
		&& (await rpgm.forge.useTextLimit()).textLimit.value === 0;
	const oldModel = rpgm.forge.settings.get('namesModel');
	if (isLastRpgmGeneration) {
		rpgm.forge.settings.set('namesModel', RPGM_MODELS.offlineNames);
		rpgm.forge.warnTextLimit();
	}

	loading.value = true;
	const oldNames = [...data.names];
	const fadeOut = new Promise<void>(p => {
		if (regenerate) {
			const l = data.names.length;
			for (let i = 0; i < l; i++)
				setTimeout(() => {
					data.names.shift();
				}, 20 * i);
			setTimeout(p, 20 * l + 1000);
		} else p();
	});

	const result = await rpgm.forge.generateNames({
		quantity: NAMES_PER_GENERATION,
		gender: 'any',
		genre: rpgm.forge.genre,
		language: rpgm.forge.language,
		type: data.prompt
	});

	loading.value = false;
	await fadeOut;
	if (result.isErr()) rpgm.forge.logger.visible.error(result.error.message);
	insertValues(result.isOk() ? result.value.names : oldNames);
	if (result.isOk()) {
		if (rpgm.forge.settings.get('namesModel').provider === 'rpgm-tools')
			if ((await rpgm.forge.useTextLimit()).decrement() == 0) {
				rpgm.forge.logger.visible.warn(rpgm.localize('RPGM_FORGE.ERRORS.TEXT_LIMIT'));
				rpgm.forge.settings.set('namesModel', { provider: 'offline', slug: 'rpgm-names-offline', type: 'text' });
			}
	}

	if (isLastRpgmGeneration) rpgm.forge.settings.set('namesModel', oldModel);
}

const buttons: RadialButton[] = [{
	category: rpgm.radialMenu.categories.rpgm_forge,
	callback: async () => generate(true),
	icon: 'fa fa-refresh',
	tooltip: 'RPGM_FORGE.RADIAL_MENU.REGENERATE',
	logger: rpgm.forge.logger
}];

/**
 * Apply a name to the currently selected token.
 * @param name - The name to apply
 */
function assign(name: string) {
	const token = getSelectedToken();
	if (!token) return;
	const oldName = token.name;
	void nameToken(token.document, name);
	data.names[data.names.indexOf(name)] = oldName;
}

onMounted(() => {
	if (!data.names.length && !loading.value) void generate();
});
</script>

<template>
	<ChatWizardContainer
		:wizard="names"
		:buttons
	>
		<h2>{{ data.prompt }}</h2>
		<SkeletonParagraph
			:loading="false"
			width="100%"
			height="400px"
		>
			<TransitionGroup
				name="rpgm-forge-name"
				class="rpgm-forge-name-container"
				tag="ul"
			>
				<li
					v-for="name in data.names"
					:key="name"
					class="rpgm-forge-name"
					@click="assign(name)"
				>
					{{ name }}
				</li>
			</TransitionGroup>
		</SkeletonParagraph>
	</ChatWizardContainer>
</template>

<style>
.rpgm-forge-name-container {
	position: relative;
	padding-left: 4px;
	margin: 0 !important;
}

.rpgm-forge-name::marker {
	content: "‣ ";
}

.rpgm-forge-name {
	position: relative;
	left: 0;
	font-weight: bold;
	scale: 1;
	transition: transform 150ms ease-in-out, color 150ms, scale 150ms !important;
	transform-origin: left;
	cursor: pointer;
}

.rpgm-forge-name:hover {
	color: #6633cc;
	scale: 1.1;
	transform: translateX(4px);
}

.rpgm-forge-name-enter-active,
.rpgm-forge-name-leave-active {
	transition-property: all !important;
	transition-duration: 750ms !important;
	transition-timing-function: ease !important;
}

.rpgm-forge-name-enter-from {
	opacity: 0;
	max-height: 0;
	left: -10px;
}

.rpgm-forge-name-leave-to {
	opacity: 0;
	max-height: 0;
	left: 100%;
}

.rpgm-forge-name-enter-to,
.rpgm-forge-name-leave-from {
	opacity: 1;
	max-height: 50px;
	left: 0px;
}
</style>
