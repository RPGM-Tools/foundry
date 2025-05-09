<script setup lang="ts">
const { generation } = defineProps<{ generation?: Homebrew }>();
</script>

<template>
	<div>
		<h3 class="rpgm-homebrew-display-fields">{{ generation?.flavor_text }}</h3>
		<div class="rpgm-homebrew-display-fields" v-if="generation">
			<template v-for="field in generation.fields" :key="field">
				<h3>{{ field.name }}</h3>
				<p>{{ field.value }}</p>
			</template>
		</div>
	</div>
</template>

<style>
.rpgm-homebrew-display-fields {
	font-style: italic;
}

.rpgm-homebrew-display-fields * {
	user-select: text;
}
</style>
