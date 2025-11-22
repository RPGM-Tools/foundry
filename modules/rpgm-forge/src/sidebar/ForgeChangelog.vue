<!--
	ForgeChangelog.vue
	Displays the collapsible changelog entries for the RPGM Forge sidebar panel.
	Last updated: 2025-11-22
-->
<script setup lang="ts">
import { useResize } from '#/sidebar';
import { useMarkdown } from '#/util';
import C1 from '$$/assets/changelog/v2.0.0.md?url';
import C2 from '$$/assets/changelog/v2.0.1.md?url';
import C3 from '$$/assets/changelog/v2.1.0.md?url';
import C4 from '$$/assets/changelog/v2.1.1.md?url';
import C5 from '$$/assets/changelog/v2.1.2.md?url';
import C6 from '$$/assets/changelog/v2.1.3.md?url';
import C7 from '$$/assets/changelog/v2.1.4.md?url';

const c7text = useMarkdown(C7);
const c6text = useMarkdown(C6);
const c5text = useMarkdown(C5);
const c4text = useMarkdown(C4);
const c3text = useMarkdown(C3);
const c2text = useMarkdown(C2);
const c1text = useMarkdown(C1);
const resize = useResize(250);
</script>

<template>
	<NCollapse
		accordion
		default-expanded-names="1"
		display-directive="show"
		@update:expanded-names="resize"
	>
		<NCollapseItem name="1" title="v2.1.4 - 2025-11-22">
			<p v-html="c7text" />
		</NCollapseItem>
		<NCollapseItem name="2" title="v2.1.3 - 2025-11-13">
			<p v-html="c6text" />
		</NCollapseItem>
		<NCollapseItem name="3" title="v2.1.2 - 2025-11-11">
			<p v-html="c5text" />
		</NCollapseItem>
		<NCollapseItem name="4" title="v2.1.1 - 2025-10-04">
			<p v-html="c4text" />
		</NCollapseItem>
		<NCollapseItem name="5" title="v2.1.0 - 2025-09-27">
			<p v-html="c3text" />
		</NCollapseItem>
		<NCollapseItem name="6" title="v2.0.1 - 2025-09-16">
			<p v-html="c2text" />
		</NCollapseItem>
		<NCollapseItem name="7" title="v2.0.0 - 2025-09-15">
			<p v-html="c1text" />
		</NCollapseItem>
		<template #arrow>
			<i
				class="fa-solid fa-chevron-right"
				style="margin-right: 4px; font-size: 0.85rem"
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
