<!--
File: SidebarAccountSignedIn.vue
Purpose: Render the Foundry membership summary from the shared RPGM Tools account session.
Last updated: 2026-05-30
-->

<script setup lang="ts">
import { useFoundryAccountBridge } from '#/auth/accountBridge';

const accountBridge = useFoundryAccountBridge();
</script>

<template>
	<div class="bridge-account">
		<NFlex vertical class="bridge-account-panel">
			<NP class="account-display-name">
				{{ accountBridge.snapshot.value.displayName }}
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
			<NAlert type="success" :show-icon="false">
				{{ accountBridge.snapshot.value.sourceSummary }}
			</NAlert>
			<div class="rpgm-info">
				<div class="account-summary-item">
					<span class="account-summary-label">Membership</span>
					<span class="account-summary-value">{{
						accountBridge.snapshot.value.membershipSummary
					}}</span>
				</div>
				<div class="account-summary-item">
					<span class="account-summary-label">Managed usage</span>
					<span class="account-summary-value">{{
						accountBridge.snapshot.value.usageReadinessSummary
					}}</span>
				</div>
				<div class="account-summary-item">
					<span class="account-summary-label">Ore</span>
					<span class="account-summary-value">{{
						accountBridge.snapshot.value.economySummary
					}}</span>
				</div>
			</div>
			<NButton
				type="primary"
				size="large"
				block
				class="account-action-button"
				@click="accountBridge.openAccountSettings()"
			>
				<span class="account-action-label"
					>View RPGM Tools Account</span
				>
			</NButton>
			<NButton
				secondary
				block
				:loading="accountBridge.isLoading.value"
				@click="accountBridge.refresh()"
			>
				Refresh
			</NButton>
			<NButton
				block
				ghost
				@click="accountBridge.disconnectFoundrySession()"
			>
				Disconnect this session
			</NButton>
		</NFlex>
	</div>
</template>

<style scoped>
.bridge-account {
	width: 100%;
}

.bridge-account-panel {
	gap: 12px;
}

.rpgm-info {
	display: grid;
	gap: 12px;
	margin-top: 4px;
	margin-bottom: 8px;
}

.account-display-name {
	margin: 0;
	color: var(--n-text-color-2);
}

.account-summary-item {
	display: grid;
	gap: 4px;
}

.account-summary-label {
	font-size: 0.9rem;
	font-weight: 700;
	color: var(--n-text-color-2);
}

.account-summary-value {
	display: block;
	overflow-wrap: anywhere;
	line-height: 1.35;
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
