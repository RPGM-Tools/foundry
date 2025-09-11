<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

import SignedIn from '#/util/SignedIn.vue';

import SidebarAccountSignedIn from './SidebarAccountSignedIn.vue';
import SidebarLoading from './SidebarLoading.vue';
import SignIn from './SignIn.vue';

const session = rpgm.auth.useSession();
const router = useRouter();
const goBack = useRoute().query.back as 'true' | undefined;

watch(session, (n) => {
	if (!n.data) return;
	if (goBack === 'true') {
		router.back();
	}
});
</script>

<template>
	<NCard>
		<SignedIn>
			<template #fallback>
				<SidebarLoading />
			</template>
			<template #default>
				<SidebarAccountSignedIn />
			</template>
			<template #not-signed-in>
				<SignIn />
			</template>
		</SignedIn>
		<RouterLink
			#="{ navigate }"
			to="/account/bring-your-own-ai"
			custom
		>
			<span style="width: 100%; display: inline-flex; justify-content: end; margin-top: 8px;">
				<a
					class="rpgm-link"
					@click="navigate"
				>
					I have my own AI 
					<i class="fas fa-robot" />
				</a>
			</span>
		</RouterLink>
	</NCard>
</template>
