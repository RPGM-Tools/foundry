<script setup lang="ts">
import { NaiveUIThemeOverrides } from '#/style/theme';
import SignedIn from '#/util/SignedIn.vue';

import ForgeSidebarByoAI from './ForgeSidebarByoAI.vue';
const onResize = inject<(forceCenter?: boolean) => void>('onResize');

const tabValue = computed({
	get() { return rpgm.forge.settings.mode; },
	set(v) { rpgm.forge.settings.mode = v; }
});

const primaryColor = NaiveUIThemeOverrides.common.primaryColor;

watch(tabValue, () => {
	setTimeout(() => {
		onResize?.(true);
	}, 300);
});
</script>

<template>
	<NCard title="Select a mode to use Forge">
		<template #header-extra>
			<NPopover
				placement="bottom-end"
				:show-arrow="false"
				style="max-width: 300px;"
			>
				<template #trigger>
					<NButton
						text
						type="info"
					>
						<i class="fas fa-circle-info" />
					</NButton>
				</template>
				Lorem ipsum dolor sit amet
				consectetur adipisicing elit.
				Quisquam, quod.
				Lorem ipsum dolor sit amet
				consectetur adipisicing elit.
				Quisquam, quod.
				Lorem ipsum dolor sit amet
				consectetur adipisicing elit.
				Quisquam, quod.
				Lorem ipsum dolor sit amet
				consectetur adipisicing elit.
				Quisquam, quod.
			</NPopover>
		</template>
		<NTabs
			v-model:value="tabValue"
			type="segment"
			animated
			:data-value="tabValue"
		>
			<NTabPane
				name="rpgm"
				tab="Online"
				display-directive="show:lazy"
			>
				<template #tab>
					<NText :type="tabValue === 'rpgm' ? 'default' : 'primary'">
						RPGM Tools
					</NText>
				</template>
				<SignedIn>
					<NResult
						size="small"
						status="success"
						title="You are signed in"
						description="Enjoy using Forge!"
					/>
					<template #not-signed-in>
						<NResult
							size="small"
							status="warning"
							title="Not signed in"
							description="You must be signed in to use Forge online."
						>
							<template #footer>
								<RouterLink
									to="/account?back=true"
									custom
									#="{ navigate }"
								>
									<NFlex vertical>
										<NButton
											tertiary
											type="warning"
											@click="navigate"
										>
											Sign In
										</NButton>
									</NFlex>
								</RouterLink>
							</template>
						</NResult>
					</template>
				</SignedIn>
			</NTabPane>
			<NTabPane
				name="diy"
				tab="DIY"
				display-directive="show:lazy"
			>
				<template #tab>
					<NText>
						DIY
					</NText>
				</template>
				<ForgeSidebarByoAI />
			</NTabPane>
			<NTabPane
				name="offline"
				tab="Offline"
				display-directive="show:lazy"
			>
				<template #tab>
					<NText>
						Offline
					</NText>
				</template>
				Offline mode
			</NTabPane>
		</NTabs>
	</NCard>
</template>

<style scoped>
.n-tabs[data-value="rpgm"] {
	--n-tab-color-segment: v-bind(primaryColor) !important;
}
</style>
