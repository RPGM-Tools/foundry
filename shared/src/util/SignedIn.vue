<script setup lang="ts">
const signedIn = rpgm.auth.useSession();

const onResize = inject<(forceCenter?: boolean) => void>('onResize');

watch(signedIn, () => {
	onResize?.(true);
});
</script>

<template>
	<Transition name="rpgm-fade">
		<slot
			v-if="signedIn.data?.session"
			v-bind="$attrs"
		/>
		<slot
			v-else-if="signedIn.isPending"
			v-bind="$attrs"
			name="loading"
		/>
		<slot
			v-else
			name="not-signed-in"
			v-bind="$attrs"
		/>
	</Transition>
</template>
