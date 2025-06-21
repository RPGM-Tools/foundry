<script setup lang="ts">
import SavedCheck from './SavedCheck.vue';
import type { WizardData } from './ChatWizard';

const { wizard } = defineProps<{ wizard: WizardData<object> }>(), { element, message, saved } = wizard;

onMounted(() => {
	const del = message["delete"].bind(message);
	message["delete"] = async () => {
		// Null check just in case
		element?.classList.add("rpgm-close");
		await new Promise(r => setTimeout(r, 200));
		return del({});
	};
});
</script>

<template>
	<div class="rpgm-app static">
		<SavedCheck :saved />
		<slot />
	</div>
</template>
