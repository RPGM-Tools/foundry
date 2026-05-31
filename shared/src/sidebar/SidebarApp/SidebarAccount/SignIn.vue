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
		<NH2>Membership</NH2>
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
			@click="accountBridge.openConnectOrCreateAccount()"
		>
			<span class="account-action-label">
				<span>Connect</span>
				<span>RPGM Tools</span>
				<span>Account</span>
			</span>
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

.account-action-label {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	line-height: 1.1;
	gap: 2px;
}
</style>
