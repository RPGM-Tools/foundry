<!--
	SignIn.vue
	Handles the old Forge bridge handoff into the Steward-backed public account center.
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
		<div class="bridge-heading-row">
			<NH2>Old Forge Membership</NH2>
			<NTag size="small" type="warning" round> Legacy bridge </NTag>
		</div>
		<NP>
			This legacy Forge lane now starts account work on the public RPGM
			Tools settings surface. Connect or create the account there, then
			sync the signed-in Steward snapshot back into this Foundry tab.
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
		<div class="bridge-summary">
			<label>
				Display name
				<span>{{ accountBridge.snapshot.value.displayName }}</span>
			</label>
			<label>
				Membership
				<span>{{
					accountBridge.snapshot.value.membershipSummary
				}}</span>
			</label>
		</div>
		<NButton
			type="primary"
			@click="accountBridge.openConnectOrCreateAccount()"
		>
			Connect or create account
		</NButton>
		<NButton
			secondary
			:disabled="accountBridge.isLoading.value"
			@click="accountBridge.openSyncSignedInAccount()"
		>
			Sync signed-in account
		</NButton>
		<NButton quaternary @click="accountBridge.openManagePassword()">
			Manage password
		</NButton>
	</NFlex>
</template>

<style scoped>
.bridge-panel {
	gap: 12px;
}

.bridge-heading-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.bridge-heading-row h2 {
	margin: 0;
}

.bridge-summary {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.bridge-summary label {
	display: flex;
	justify-content: space-between;
	gap: 16px;
	align-items: flex-start;
}

.bridge-summary span {
	max-width: 65%;
	text-align: right;
}
</style>
