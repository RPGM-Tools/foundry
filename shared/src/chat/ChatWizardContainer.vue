<script setup lang="ts">
import RadialMenu from '#/radial-menu/RadialMenu.vue';

import type { WizardData } from './ChatWizard';
import SavedCheck from './SavedCheck.vue';

const { wizard, buttons = [] } = defineProps<{
	wizard: WizardData<object>
	buttons?: RadialButton[]
}>(), { element, message, saved } = wizard;

const context = ref<ButtonContext>({
	loading: false,
	element: wizard.element,
	shift: false,
});

onMounted(() => {
	const del = message['delete'].bind(message);
	message['delete'] = async () => {
		// Null check just in case
		element?.classList.add('rpgm-close');
		await new Promise(r => setTimeout(r, 200));
		return del({});
	};
});
</script>

<template>
	<RadialMenu v-model="context" to=".chat-message" :buttons :top="true" :right="true" :pad-document="false"
		:padding="{ top: 40, right: 0 }" />
	<div class="rpgm-app static">
		<SavedCheck :saved />
		<slot />
	</div>
</template>
