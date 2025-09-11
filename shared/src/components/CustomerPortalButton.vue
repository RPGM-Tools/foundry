<script setup lang="ts">
import { NButton } from 'naive-ui';

import { useFocusCheck, useSubscription } from '#/util';
import { LoadingBoundry } from '#/util/useLoading';

const { subscription, update } = useSubscription();

const check = useFocusCheck(async () => {	
	const oldS = subscription.value;
	const newS = await update();
	return Boolean(oldS) !== Boolean(newS) 
		|| (oldS?.canceledAt?.getTime() !== newS?.canceledAt?.getTime()) 
		|| (oldS?.productId !== newS?.productId);
});

async function openPortal() {
	return rpgm.auth.customer.portal().then(portal => {
		if (portal.error) return;
		window.open(portal.data.url, '_blank');
		check();
	});
}
</script>

<template>
	<LoadingBoundry #="{ loading, start }">
		<NButton
			:disabled="loading.value"
			type="primary"
			:loading="loading.value"
			v-bind="$attrs"
			@click="start(openPortal())"
		>
			Member Portal
			<template #icon>
				<i class="fa-solid fa-galaxy" />
			</template>
		</NButton>
	</LoadingBoundry>
</template>
