<script setup lang="ts">
import { useSetting } from '#/util';

const xsollaToken = useSetting("rpgm-tools.login-token");

defineProps<{
	user: object
}>();

const emits = defineEmits<{
	logout: []
}>();

function logout() {
	xsollaToken.value = "";
	xsollaToken.save();
	emits("logout");
}
</script>

<template>
	<div>
		<p>{{ JSON.stringify(user, null, 2) }}</p>

		<button @click.prevent="logout">
			<i class="fas fa-door" />
			Log Out
		</button>
	</div>
</template>
