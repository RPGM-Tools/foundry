<script setup lang="ts">
import { watchDebounced } from '@vueuse/core';

const element = inject<HTMLElement>('element')!;
const chatIconRow = element.querySelector('.message-metadata');
const props = defineProps<{ saved: boolean }>();
const checked = ref(false);

watch(props, () => checked.value = true);
watchDebounced(props, ({ saved }) => {
	if (saved)
		checked.value = false;
}, { debounce: 4000 });
</script>

<template>
	<Teleport v-if="chatIconRow" :to="chatIconRow">
		<a v-show="checked" class="message-saved">
			<i :class="saved ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-check'"
				style="text-shadow: none; cursor: default;" :title="saved ? 'Saved' : 'Not Saved'" />
		</a>
	</Teleport>
</template>
