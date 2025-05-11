<script setup lang="ts">
const { generation } = defineProps<{ generation?: Homebrew }>();
</script>

<template>
	<div class="rpgm-homebrew-field-container">
		<h3 class="rpgm-homebrew-field-flavor-text">{{ generation?.flavor_text }}</h3>
		<div class="rpgm-homebrew-display-fields" v-if="generation">
			<template v-for="field in generation.fields" :key="field">
				<h3 class="rpgm-homebrew-field-name">{{ field.name }}</h3>
				<p>{{ field.value }}</p>
			</template>
		</div>
	</div>
</template>

<style>
.rpgm-homebrew-field-flavor-text {
	font-style: italic;
	font-size: 20px;
	border-bottom: 4px solid black;
}

.rpgm-homebrew-display-fields {
	font-style: italic;
}

.rpgm-homebrew-display-fields * {
	user-select: text;
}
</style>
