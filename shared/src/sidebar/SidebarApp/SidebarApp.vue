<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router';

import { titleKey } from '#/sidebar';
import { NaiveTheme, NaiveUIThemeOverrides } from '#/style/theme';
import { vFitLines } from '#/util/VFitLines';
import WriteOn from '#/util/WriteOn';

import PolyhedriumBalance from './PolyhedriumBalance.vue';

const root = useTemplateRef('root');
const router = useRouter();
const route = useRoute();

const onResize = inject<(forceCenter?: boolean) => void>('onResize');

const primaryColor = NaiveUIThemeOverrides.common.primaryColor;

const titleOverride = ref<string>();
const currentTitle = computed(() => titleOverride.value ?? route.meta.title ?? '');
router.afterEach(() => void (titleOverride.value = undefined));
provide(titleKey, (title) => {
	titleOverride.value = title;
});

function focus() {
	root.value?.focus();
	onResize?.(true);
}

onMounted(() => {
	setTimeout(focus, 100);
});
</script>

<template>
	<div
		ref="root"
		tabindex="0"
		class="rpgm-app static rpgm-sidebar-window"
		@keydown.meta.left.prevent="$router.back"
	>
		<NaiveTheme>
			<span class="sidebar-title-container">
				<WriteOn
					class="sidebar-title"
					style="display: flex; overflow: hidden; align-items: center;"
					:value="currentTitle"
					#="display"
					:duration="400"
				>
					<i
						:class="{ 'hide-sidebar-back': $route.path === '/' }"
						tabindex="0"
						class="fas fa-chevron-left sidebar-back"
						@click="$router.back"
						@keydown.space.prevent="$router.back"
						@keydown.enter.prevent="$router.back"
					/>
					<span
						:key="display.value"
						v-fit-lines
						style="flex: 1; min-width: 0; padding-top: 4px; padding-bottom: 4px;"
					>
						{{ display }}
					</span>
					<PolyhedriumBalance style="display: flex; align-items: center; margin-right: 4px;" />
				</WriteOn>
			</span>
			<div
				class="sidebar-content"
			>
				<RouterView
					:key="$route.fullPath"
					#="{ Component }"
				>
					<template v-if="Component">
						<Transition
							name="rpgm-zoom"
							@after-enter="focus"
						>
							<Suspense timeout="0">
								<component :is="Component" />
								<template #fallback>
									<NCard>
										<NFlex vertical>
											<NSpin style="height: 20vh;" />
										</NFlex>
									</NCard>
								</template>
							</Suspense>
						</Transition>
					</template>
				</RouterView>
			</div>
		</NaiveTheme>
	</div>
</template>

<style scoped>
.sidebar-popout .sidebar-content {
	min-height: unset !important;
	height: unset !important;
}

.rpgm-sidebar-window {
	height: 100%;
	display: flex;
	flex-direction: column;

	.sidebar-title-container {
		width: 100%;
		z-index: 10;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
		justify-content: center;
		margin-bottom: 0.4rem;

		.sidebar-title {
			font-size: 2rem;
			margin: 0;
		}
	}

	.sidebar-content {
		height: 100%;
		scrollbar-gutter: stable;
		padding-left: 6px;
		position: relative;
		overflow-y: scroll;
		overflow-x: hidden;
		padding-bottom: 8px;
	}
}

.sidebar-back {
	position: relative;
	height: 100%;
	left: 0.5rem;
	font-size: 2rem;
	z-index: 1;
	cursor: pointer;
	transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	outline: none;
	margin-right: 0.85rem;

	&.hide-sidebar-back {
		margin-left: -2rem;
		/* transform: translateX(-125%) scale(1, 0); */
	}

	&:not(.hide-sidebar-back):focus,
	&:not(.hide-sidebar-back):hover {
		--color: v-bind(primaryColor);
		color: var(--color);
		text-shadow: 0 0 4px var(--color);
		margin-right: 1.35rem;
		transform: translateX(12%) scale(1.25, 1);
	}
}
</style>
