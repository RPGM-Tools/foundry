<script setup lang="ts">
import { an, useSubscription } from '#/util';

import CustomerPortalButton from './CustomerPortalButton.vue';

const { showButton = true } = defineProps<{ showButton?: boolean }>();

const { subscription } = useSubscription();
</script>

<template>
	<NAlert
		:show-icon="false"
		title="Membership Active"
		type="success"
	>
		<NFlex vertical>
			<p>
				Looks like you are {{ an(subscription?.product.name || 'Member') }}
				<NText depth="1">
					{{ subscription?.product.name || 'Member' }}.
				</NText>
				You can upgrade or make changes to your membership in the Member Portal.
			</p>
			<CustomerPortalButton
				v-if="showButton"
				type="success"
			/>
		</NFlex>
	</NAlert>
</template>
