<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

import { useFoundryAccountBridge } from '#/auth/accountBridge';
import IHaveMyOwnAI from '#/components/IHaveMyOwnAI.vue';

import SidebarAccountSignedIn from './SidebarAccountSignedIn.vue';
import SignIn from './SignIn.vue';

const accountBridge = useFoundryAccountBridge();
const router = useRouter();
const goBack = useRoute().query.back as 'true' | undefined;

watch(
	() => accountBridge.snapshot.value.status,
	status => {
		if (status !== 'available') return;
		if (goBack === 'true') {
			router.back();
		}
	}
);
</script>

<template>
	<NCard>
		<NFlex vertical>
			<div style="position: relative">
				<SidebarAccountSignedIn
					v-if="accountBridge.isConnected.value"
				/>
				<SignIn v-else />
			</div>
			<IHaveMyOwnAI v-if="!accountBridge.isConnected.value" />
		</NFlex>
	</NCard>
</template>
