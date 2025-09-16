<script setup lang="ts">
import { useResize } from '#/sidebar';
import { useMarkdown } from '#/util';
import C1 from '$$/assets/changelog/v2.0.0.md?url';
import C2 from '$$/assets/changelog/v2.0.1.md?url';

const c1text = useMarkdown(C1);
const c2text = useMarkdown(C2);
const resize = useResize(250);
</script>


<template>
	<NCollapse
		accordion
		default-expanded-names="1"
		display-directive="show"
		@update:expanded-names="resize"
	>
		<NCollapseItem
			name="1"
			title="v2.0.1 - 2025-09-16"
		>
			<p v-html="c2text" />
		</NCollapseItem>
		<NCollapseItem
			name="2"
			title="v2.0.0 - 2025-09-15"
		>
			<p v-html="c1text" />
		</NCollapseItem>
		<template #arrow>
			<i
				class="fa-solid fa-chevron-right"
				style="margin-right: 4px; font-size: 0.85rem;"
			/>
		</template>
	</NCollapse>
</template>

<style scoped>
:deep(.n-collapse-item__content-inner) {
	padding: 0 !important;
}

p {
	margin: 0;
}
</style>
