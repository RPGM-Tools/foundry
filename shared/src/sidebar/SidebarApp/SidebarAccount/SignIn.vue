<!--
	SignIn.vue
	Handles the Foundry membership handoff into the shared RPGM Tools account center.
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
		<NP>
			Open your RPGM Tools account in the browser. If this browser is
			already signed in there, this session will connect automatically.
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
			size="large"
			block
			class="account-action-button"
			@click="accountBridge.openConnectOrCreateAccount()"
		>
			<span class="account-action-label">Connect RPGM Tools Account</span>
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
	width: 100%;
}

.account-action-button {
	min-height: 52px;
}

.account-action-label {
	display: block;
	width: 100%;
	text-align: center;
	white-space: normal;
	line-height: 1.25;
}
</style>
