<script setup lang="ts">
import { useRoute } from 'vue-router';

import { useTitle } from '..';
import SidebarAppHelpPage from './SidebarAppHelpPage.vue';

const helpPages = Object.fromEntries(rpgm.help.pages);

const route = useRoute();
const page = computed(() => route.params.page === ':page' ? undefined : helpPages[route.params.page as string]);

const setTitle = useTitle();

watch(page, () => {
	if (page.value) {
		setTitle(page.value.name);
	} else {
		setTitle('Help');
	}
});
</script>

<template>
	<NCard>
		<Transition
			name="rpgm-stagger"
		>
			<KeepAlive>
				<SidebarAppHelpPage
					v-if="page"
					:key="page.url"
					:page
				/>
				<NList
					v-else
					hoverable
					clickable
					style="background: none;"
				>
					<RouterLink
						v-for="(p, id) in helpPages"
						:key="id"
						custom
						:to="`/help/${id}`"
						#="{ navigate }"
					>
						<NListItem
							style="padding: 4px 4px;"
							@click="navigate"
						>
							<NH1
								style="border: none; line-height: 2rem; vertical-align: vertical; margin: 0;"
							>
								{{ p.name }}
							</NH1>
						</NListItem>
					</RouterLink>
				</NList>
			</KeepAlive>
		</Transition>
	</NCard>
</template>

<style scoped>
.help {
	white-space: pre-wrap;
}

.help *:not(ul) {
	padding: 0;
	margin: 0;
}

.divider {
	width: 100%;
	height: 1px;
	background-color: #aaa;
}
</style>
