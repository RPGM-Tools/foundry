<script setup lang="ts">
import { useSubscription } from '#/util';

import CustomerPortalButton from './CustomerPortalButton.vue';

const { showButton = true } = defineProps<{ showButton?: boolean }>();

const { subscription } = useSubscription();
</script>

<template>
	<NAlert
		:show-icon="false"
		title="Membership Canceled"
		type="warning"
	>
		<NFlex vertical>
			<p>
				Your
				<NText depth="1">
					{{ subscription?.tierName || 'membership' }}
				</NText>
				status needs attention in the hosted RPGM Tools account view.
				Use the account page to review membership details and make any
				needed changes.
			</p>
			<CustomerPortalButton
				v-if="showButton"
				type="warning"
			/>
		</NFlex>
	</NAlert>
</template>
