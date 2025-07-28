<script setup lang="ts">
import SecretsFormLoggedIn from '#/forms/SecretsFormLoggedIn.vue';
import SecretsFormLoggedOut from '#/forms/SecretsFormLoggedOut.vue';
import { type SecretsSettings, useUser } from '#/settings/secrets';

const app = inject<SecretsSettings>("app")! as SecretsSettings;

const user = ref<object>();

async function refresh() {
	user.value = await useUser();
}

/**
 Saves changed settings
 */
function submit() {
	void app.close();
};

onMounted(() => {
	void refresh();
});
</script>

<template>
	<form class="rpgm-app-inner standard-form flexcol" style="min-width: 400px;" @submit.prevent="submit">
		<div class="scrollable tab" style="position: relative;">
			<Transition name="fade">
				<SecretsFormLoggedIn v-if="user" :user @logout="refresh" />
				<SecretsFormLoggedOut v-else @login="refresh" />
			</Transition>
		</div>
		<footer class="form-footer">
			<button @click.prevent="submit">
				<i class="fas fa-x" />
				Close
			</button>
		</footer>
	</form>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease;
}

.fade-leave-active {
	position: absolute;
	top: 0;
	width: 100%;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
	opacity: 1;
}
</style>
