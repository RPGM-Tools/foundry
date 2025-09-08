<script setup lang="ts">
import { NaiveUIThemeOverrides } from '#/style/theme';

import ForgeSidebarByoAI from './ForgeSidebarByoAI.vue';

const primaryColor = NaiveUIThemeOverrides.common.primaryColor;
</script>

<template>
	<NFlex vertical>
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
			<ForgeSidebarByoAI />
		</NCard>
	</NFlex>
</template>

<style scoped>
.n-tabs[data-value="rpgm"] {
	--n-tab-color-segment: v-bind(primaryColor) !important;
}
</style>
