<script setup lang="ts">
import { useResize } from '#/sidebar';

const signedIn = rpgm.auth.useSession();

const onResize = useResize();

watch(signedIn, () => {
	setTimeout(() => onResize(true), 400);
});
</script>

<template>
	<Transition name="rpgm-fade">
		<slot
			v-if="signedIn.data?.session"
			v-bind="$attrs"
		/>
		<slot
			v-else
			name="not-signed-in"
			v-bind="$attrs"
		/>
	</Transition>
</template>
