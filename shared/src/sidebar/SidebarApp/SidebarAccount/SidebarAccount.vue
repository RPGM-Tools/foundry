<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

import IHaveMyOwnAI from '#/components/IHaveMyOwnAI.vue';
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
		<NFlex vertical>
			<div style="position: relative;">
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
			</div>
			<IHaveMyOwnAI />
		</NFlex>
	</NCard>
</template>
