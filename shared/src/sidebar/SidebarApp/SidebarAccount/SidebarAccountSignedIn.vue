<!--
File: SidebarAccountSignedIn.vue
Purpose: Render the Foundry membership summary from the shared RPGM account session.
Last updated: 2026-05-30
-->

<script setup lang="ts">
import { useFoundryAccountBridge } from '#/auth/accountBridge';

const accountBridge = useFoundryAccountBridge();
</script>

<template>
	<div class="bridge-account">
		<NFlex vertical>
			<NH1>Membership</NH1>
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
				<label>
					Membership
					<span>{{
						accountBridge.snapshot.value.membershipSummary
					}}</span>
				</label>
				<label>
					Managed usage
					<span>{{
						accountBridge.snapshot.value.usageReadinessSummary
					}}</span>
				</label>
				<label>
					Ore
					<span>{{
						accountBridge.snapshot.value.economySummary
					}}</span>
				</label>
			</div>
			<NButton
				type="primary"
				@click="accountBridge.openAccountSettings()"
			>
				Open account
			</NButton>
			<NButton
				secondary
				:loading="accountBridge.isLoading.value"
				@click="accountBridge.refresh()"
			>
				Refresh
			</NButton>
			<NButton ghost @click="accountBridge.disconnectFoundrySession()">
				Disconnect this session
			</NButton>
		</NFlex>
	</div>
</template>

<style scoped>
.bridge-account {
	width: 100%;
}

.rpgm-info {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 8px;
	margin-bottom: 8px;
}

.account-display-name {
	margin: 0;
	color: var(--n-text-color-2);
}

label {
	display: flex;
	justify-content: space-between;
	gap: 16px;
}

label span {
	max-width: 65%;
	text-align: right;
}
</style>
