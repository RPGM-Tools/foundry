<script setup lang="ts">
import SignedIn from '#/util/SignedIn.vue';

import SidebarAccountSignedIn from './SidebarAccountSignedIn.vue';
import SignIn from './SignIn.vue';
</script>

<template>
	<NCard>
		<SignedIn>
			<template #loading>
				<p>Loading</p>
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
			<a
				style="text-align: right; display: block; margin-top: 8px;"
				class="rpgm-link"
				@click="navigate"
			>I have my own AI <i class="fas fa-robot" /></a>
		</RouterLink>
	</NCard>
</template>
