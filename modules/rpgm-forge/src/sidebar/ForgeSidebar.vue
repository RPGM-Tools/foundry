<script setup lang="ts">
import IHaveMyOwnAI from '#/components/IHaveMyOwnAI.vue';
import { useResize } from '#/sidebar';
import { NaiveUIThemeOverrides } from '#/style/theme';

import ForgeChangelog from './ForgeChangelog.vue';
import ForgeSidebarByoAI from './ForgeSidebarByoAI.vue';
import ForgeSidebarConfiguration from './ForgeSidebarConfiguration.vue';

const primaryColor = NaiveUIThemeOverrides.common.primaryColor;

const resize = useResize(250);
</script>

<template>
	<NFlex>
		<NCard title="Configuration">
			<NFlex vertical>
				<NCollapse
					accordion
					default-expanded-names="1"
					@update:expanded-names="resize"
				>
					<NCollapseItem
						title="General"
						name="1"
					>
						<ForgeSidebarConfiguration />
					</NCollapseItem>
					<NCollapseItem title="Text AI">
						<ForgeSidebarByoAI />
					</NCollapseItem>
					<template #arrow>
						<i
							class="fa-solid fa-chevron-right"
							style="margin-right: 4px; font-size: 0.85rem;"
						/>
					</template>
				</NCollapse>
				<IHaveMyOwnAI />
			</NFlex>
		</NCard>
		<NCard title="Changelog">
			<ForgeChangelog />
		</NCard>
	</NFlex>
</template>

<style scoped>
.n-tabs[data-value="rpgm"] {
	--n-tab-color-segment: v-bind(primaryColor) !important;
}
</style>
