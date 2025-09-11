<script setup lang="ts">
const signedIn = rpgm.auth.useSession();

const onResize = inject<(forceCenter?: boolean) => void>('onResize');

watch(signedIn, () => {
	setTimeout(() => onResize?.(true), 400);
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
			name="fallback"
		/>
		<slot
			v-else
			name="not-signed-in"
			v-bind="$attrs"
		/>
	</Transition>
</template>
