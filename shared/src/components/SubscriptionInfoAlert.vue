<script setup lang="ts">
import { useSubscription } from '#/util';

import CustomerPortalButton from './CustomerPortalButton.vue';

const { showButton = true } = defineProps<{ showButton?: boolean }>();

const { subscription } = useSubscription();
</script>

<template>
	<NAlert :show-icon="false" title="Membership Active" type="success">
		<NFlex vertical>
			<p>
				Welcome, {{ subscription?.tierName || 'Member' }}! You can
				review or change your membership in the hosted RPGM Tools
				account view.
			</p>
			<CustomerPortalButton v-if="showButton" type="success" />
		</NFlex>
	</NAlert>
</template>
