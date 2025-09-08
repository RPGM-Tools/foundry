<script setup lang="ts">
import { LoadingBoundry } from '#/util/useLoading';

import LegacyDiceIcon from './LegacyDiceIcon.vue';

const session = rpgm.auth.useSession();

const welcome = computed(() => {
	if (!session.value.data) return 'Welcome';
	// const name = session.value.data.user.displayUsername || session.value.data.user.username || session.value.data.user.name;
	const name = session.value.data.user.name || session.value.data.user.displayUsername || session.value.data.user.username;
	return session.value.data ? `Welcome back, ${name}!` : 'Welcome back!';
});

async function logout() {
	return rpgm.auth.signOut();
}

const accounts = ref<{ provider: string }[]>([]);

const discordLinked = computed(() => accounts.value.some(a => a.provider === 'discord'));

onMounted(() => {
	rpgm.auth.listAccounts().then(r => {
		if (r.data) {
			accounts.value = r.data;
		}
	});
});

async function linkDiscord() {
	return rpgm.auth.linkSocial({
		provider: 'discord'
	}).then(r => {
		if (r.data) 
			window.open(r.data.url, '_blank');
	});
}
</script>

<template>
	<div>
		<NH1>
			{{ welcome }}
			<span class="rpgm-badges">
				<LegacyDiceIcon v-if="session.data?.user.legacy" />
			</span>
		</NH1>
		<div class="rpgm-info">
			<label>
				Username
				<span>{{ session.data?.user.displayUsername }}</span>
			</label>
			<label>
				Email
				<span>{{ session.data?.user.email }}</span>
			</label>
		</div>
		<NFlex vertical>
			<LoadingBoundry #="{ loading, start }">
				<NButton
					type="primary"
					secondary
					:loading="loading.value"
					@click="start(linkDiscord())"
				>
					<template #icon>
						<i class="fab fa-discord" />
					</template>
					{{ discordLinked ? "Linked" : "Link Discord" }}
				</NButton>
			</LoadingBoundry>
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
