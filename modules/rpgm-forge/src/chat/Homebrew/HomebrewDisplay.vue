<script setup lang="ts">
const { generation } = defineProps<{ generation: string }>();

const { generations } = inject<ForgeChatHomebrew>("data")!;
const isSecure = ref(window.isSecureContext);

/**
 * Copies the description to clipboard
 * @param field - The field to copy
 */
function copy(field: HomebrewField) {
	try {
		void navigator.clipboard.writeText(`### ${field.name}\n${field.value}`);
		rpgm.forge!.logger.logU(`Copied "${field.name}" to clipboard!`);
	} catch { return; }
}
</script>

<template>
	<div class="rpgm-homebrew-field-container">
		<h3 class="rpgm-homebrew-field-flavor-text">{{ generations[generation]?.flavor_text }}</h3>
		<div v-if="generation" class="rpgm-homebrew-display-fields">
			<div v-for="field in generations[generation].fields" :key="field.name" class="rpgm-homebrew-display-field">
				<div class="rpgm-icons">
					<a v-if="isSecure" title="Copy to clipboard" @click="copy(field)"><i class="fa-solid fa-copy" /></a>
				</div>
				<h3 class="rpgm-homebrew-field-name">{{ field.name }}</h3>
				<p>{{ field.value }}</p>
			</div>
		</div>
	</div>
</template>

<style>
.rpgm-homebrew-field-flavor-text {
	font-style: italic;
	font-size: 17px;
	border-bottom: 4px solid black;
}

.rpgm-homebrew-display-fields {
	font-style: italic;
}

.rpgm-homebrew-field-flavor-text,
.rpgm-homebrew-display-fields * {
	user-select: text;
}

.rpgm-homebrew-display-field:hover .rpgm-icons {
	opacity: 1;
	filter: blur(0px);
	visibility: visible;
}
</style>
