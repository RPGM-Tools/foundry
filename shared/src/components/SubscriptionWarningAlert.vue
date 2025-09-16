<script setup lang="ts">
import { useSubscription } from '#/util';

import CustomerPortalButton from './CustomerPortalButton.vue';

const { showButton = true } = defineProps<{ showButton?: boolean }>();

const { subscription } = useSubscription();

function formatDate(date: Date) {
	return new Date(date).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}
</script>

<template>
	<NAlert
		:show-icon="false"
		title="Membership Canceled"
		type="warning"
	>
		<NFlex vertical>
			<p>
				It looks like your
				<NText depth="1">
					{{ subscription?.product.name }}
				</NText>
				membership has been canceled and will expire on {{ formatDate(subscription!.currentPeriodEnd!) }}.
				You can still continue to use your account.
				You can reactivate your membership in the Member Portal.
			</p>
			<CustomerPortalButton
				v-if="showButton"
				type="warning"
			/>
		</NFlex>
	</NAlert>
</template>
