<!--
	SignIn.vue
	Handles the Foundry membership handoff into the shared RPGM account center.
	Last updated: 2026-05-30
-->
<script setup lang="ts">
import { useFoundryAccountBridge } from '#/auth/accountBridge';

const accountBridge = useFoundryAccountBridge();

const bridgeStatusTone = computed(() => {
	if (accountBridge.snapshot.value.status === 'unavailable') {
		return 'warning';
	}

	return 'info';
});
</script>

<template>
	<NFlex vertical class="bridge-panel">
		<NH2>Membership</NH2>
		<NP>
			Open your RPGM account in the browser. If you are already signed in
			there, this session will connect automatically when you return.
		</NP>
		<NAlert
			v-if="accountBridge.notice.value"
			:type="
				accountBridge.notice.value.kind === 'warning'
					? 'warning'
					: 'info'
			"
			:show-icon="false"
			closable
			@close="accountBridge.clearNotice()"
		>
			{{ accountBridge.notice.value.message }}
		</NAlert>
		<NAlert :type="bridgeStatusTone" :show-icon="false">
			{{ accountBridge.snapshot.value.sourceSummary }}
		</NAlert>
		<NButton
			type="primary"
			@click="accountBridge.openConnectOrCreateAccount()"
		>
			Open account
		</NButton>
		<NButton
			v-if="accountBridge.snapshot.value.status === 'unavailable'"
			secondary
			:disabled="accountBridge.isLoading.value"
			@click="accountBridge.refresh()"
		>
			Refresh
		</NButton>
	</NFlex>
</template>

<style scoped>
.bridge-panel {
	gap: 12px;
}

.bridge-panel h2 {
	margin: 0;
}
</style>
