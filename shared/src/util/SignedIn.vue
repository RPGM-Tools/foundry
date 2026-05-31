<script setup lang="ts">
import { useFoundryAccountBridge } from '#/auth/accountBridge';
import { useResize } from '#/sidebar';

const accountBridge = useFoundryAccountBridge();

const onResize = useResize();

watch(accountBridge.isConnected, () => {
	setTimeout(() => onResize(true), 400);
});
</script>

<template>
	<Transition name="rpgm-fade">
		<slot v-if="accountBridge.isConnected.value" v-bind="$attrs" />
		<slot v-else name="not-signed-in" v-bind="$attrs" />
	</Transition>
</template>
