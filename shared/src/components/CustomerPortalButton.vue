<script setup lang="ts">
import { NButton } from 'naive-ui';

import { useFoundryAccountBridge } from '#/auth/accountBridge';
import { LoadingBoundry } from '#/util/useLoading';

const accountBridge = useFoundryAccountBridge();

async function openPortal() {
	accountBridge.openForgeMembership();
	return Promise.resolve();
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
			Manage on RPGM Tools
			<template #icon>
				<i class="fa-solid fa-galaxy" />
			</template>
		</NButton>
	</LoadingBoundry>
</template>
