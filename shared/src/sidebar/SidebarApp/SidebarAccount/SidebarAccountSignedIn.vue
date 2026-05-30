<!--
File: SidebarAccountSignedIn.vue
Purpose: Render the Steward-backed account summary for the legacy old Forge bridge lane.
Last updated: 2026-05-30
-->

<script setup lang="ts">
import { useFoundryAccountBridge } from '#/auth/accountBridge';

const accountBridge = useFoundryAccountBridge();

const welcome = computed(
	() => `Welcome back, ${accountBridge.snapshot.value.displayName}!`
);
</script>

<template>
	<div class="bridge-account">
		<NFlex vertical>
			<NH1>
				{{ welcome }}
				<span class="rpgm-badges">
					<NTag size="small" type="warning" round>
						Legacy bridge
					</NTag>
				</span>
			</NH1>
			<NAlert
				v-if="accountBridge.notice.value"
				:type="accountBridge.notice.value.kind === 'warning' ? 'warning' : 'info'"
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
					Display name
					<span>{{ accountBridge.snapshot.value.displayName }}</span>
				</label>
				<label>
					Membership
					<span>{{ accountBridge.snapshot.value.membershipSummary }}</span>
				</label>
				<label>
					Managed usage
					<span>{{ accountBridge.snapshot.value.usageReadinessSummary }}</span>
				</label>
				<label>
					Ore
					<span>{{ accountBridge.snapshot.value.economySummary }}</span>
				</label>
				<label>
					Profile visibility
					<span>{{ accountBridge.snapshot.value.visibilitySummary }}</span>
				</label>
				<label>
					Profile text
					<span>{{ accountBridge.snapshot.value.profileSummary }}</span>
				</label>
			</div>
			<NButton
				type="primary"
				:loading="accountBridge.isLoading.value"
				@click="accountBridge.refresh()"
			>
				Refresh summary
			</NButton>
			<NButton secondary @click="accountBridge.openSyncSignedInAccount()">
				Sync signed-in account
			</NButton>
			<NButton quaternary @click="accountBridge.openAccountSettings()">
				Open account settings
			</NButton>
			<NButton quaternary @click="accountBridge.openManagePassword()">
				Manage password
			</NButton>
			<NButton ghost @click="accountBridge.disconnectFoundrySession()">
				Disconnect this Foundry session
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

h2 {
	display: flex;
	flex-wrap: wrap;
}

label {
	display: flex;
	justify-content: space-between;
	gap: 16px;
}

.rpgm-badges {
	margin-left: auto;
}

label span {
	max-width: 65%;
	text-align: right;
}
</style>
