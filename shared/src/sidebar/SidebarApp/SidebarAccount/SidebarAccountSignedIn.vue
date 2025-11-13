<!--
File: SidebarAccountSignedIn.vue
Purpose: Render signed-in account details and manage Discord linking within the sidebar account panel.
Last updated: 2025-11-11
-->

<script setup lang="ts">
import { RouterLink } from 'vue-router';

import CustomerPortalButton from '#/components/CustomerPortalButton.vue';
import SubscriptionWarningAlert from '#/components/SubscriptionWarningAlert.vue';
import { useAccounts, useFocusCheck, useSubscription } from '#/util';
import { LoadingBoundry } from '#/util/useLoading';

import LegacyDiceIcon from './LegacyDiceIcon.vue';

const session = rpgm.auth.useSession();

const welcome = computed(() => {
	if (!session.value.data) return 'Welcome';
	// const name = session.value.data.user.displayUsername || session.value.data.user.username || session.value.data.user.name;
	const name =
		session.value.data.user.name ||
		session.value.data.user.displayUsername ||
		session.value.data.user.username;
	return session.value.data ? `Welcome back, ${name}!` : 'Welcome back!';
});

const subscriptionCanceling = computed(() =>
	Boolean(
		subscription.value?.status === 'active' && subscription.value.canceledAt
	)
);

async function logout() {
	return rpgm.auth.signOut();
}

const discordAccount = computed(
	() => accounts.value?.find(a => a.provider === 'discord') ?? null
);

const { subscription, update: updateSubscription } = useSubscription();

const { userInfo, update: updateUserInfo } = rpgm.useUserInfo();

const subscriptionName = computed(() => userInfo.value?.data?.tier.name);

const {
	accounts,
	isLoading: accountsLoading,
	update: updateAccounts
} = useAccounts();

if (!subscription.value) {
	await updateSubscription();
} else {
	updateSubscription();
}

if (!discordAccount.value) {
	await updateAccounts();
} else {
	updateAccounts();
}

if (!userInfo.value) {
	await updateUserInfo();
} else {
	updateUserInfo();
}

const discordLinkedCheck = useFocusCheck(
	() =>
		updateAccounts().then(r =>
			Boolean(r?.some(a => a.provider === 'discord'))
		),
	5
);

async function linkDiscord() {
	return rpgm.auth
		.linkSocial({
			provider: 'discord',
			callbackURL: 'https://rpgm.tools/linked'
		})
		.then(r => {
			if (r.data) {
				window.open(r.data.url, '_blank');
				discordLinkedCheck();
			}
		});
}
</script>

<template>
	<div>
		<NFlex vertical>
			<NH1>
				{{ welcome }}
				<span class="rpgm-badges">
					<LegacyDiceIcon v-if="session.data?.user.legacy" />
				</span>
			</NH1>
			<SubscriptionWarningAlert v-if="subscriptionCanceling" />
			<div class="rpgm-info">
				<label>
					Username
					<span>{{ session.data?.user.displayUsername }}</span>
				</label>
				<label>
					Email
					<span>{{ session.data?.user.email }}</span>
				</label>
				<label>
					Membership
					<span>{{ subscriptionName }}</span>
				</label>
			</div>
			<LoadingBoundry #="{ loading, start }">
				<NButton
					type="primary"
					color="#5865F2"
					round
					:disabled="!!discordAccount"
					:loading="!discordAccount && (loading.value || accountsLoading)"
					@click="start(linkDiscord())"
				>
					<template #icon>
						<i class="fab fa-discord" />
					</template>
					{{ discordAccount ? 'Linked' : 'Link Discord' }}
				</NButton>
			</LoadingBoundry>
			<RouterLink to="/guildhall" #="{ navigate }" custom>
				<NButton type="primary" style="height: 51px" @click="navigate">
					<template #icon>
						<i class="fas fa-house-turret" />
					</template>
					Guild Hall
				</NButton>
			</RouterLink>
			<CustomerPortalButton style="height: 51px" />
			<LoadingBoundry #="{ loading, start }">
				<NButton
					type="primary"
					ghost
					:loading="loading.value"
					@click="start(logout())"
				>
					<template #icon>
						<i class="fa fa-person-to-door" />
					</template>
					Sign Out
				</NButton>
			</LoadingBoundry>
		</NFlex>
	</div>
</template>

<style scoped>
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
}

.rpgm-badges {
	margin-left: auto;
}
</style>
