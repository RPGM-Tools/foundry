<script setup lang="ts">
const signedIn = rpgm.auth.useSession();
</script>

<template>
	<Transition name="rpgm-fade">
		<slot
			v-if="signedIn.isPending"
			v-bind="$attrs"
			name="loading"
		/>
		<slot
			v-else-if="signedIn.data?.session"
			v-bind="$attrs"
		/>
		<slot
			v-else
			name="not-signed-in"
			v-bind="$attrs"
		/>
	</Transition>
</template>
