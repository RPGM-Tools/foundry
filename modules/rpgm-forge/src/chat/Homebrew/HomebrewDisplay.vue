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
		<div class="rpgm-homebrew-display-fields" v-if="generation">
			<div class="rpgm-homebrew-display-field" v-for="field in generations[generation].fields" :key="field.name">
				<div class="rpgm-icons">
					<a @click="copy(field)" v-if="isSecure" title="Copy to clipboard"><i class="fa-solid fa-copy"></i></a>
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
