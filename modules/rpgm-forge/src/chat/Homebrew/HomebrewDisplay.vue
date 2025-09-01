<script setup lang="ts">
import { HomebrewField } from '@rpgm/tools/forge';

const { generation } = defineProps<{ generation: string }>();

const { generations } = inject<ForgeChatHomebrew>('data')!;
const isSecure = ref(window.isSecureContext);

/**
 * Copies the description to clipboard.
 * @param field - The field to copy
 */
function copy(field: HomebrewField) {
	try {
		void navigator.clipboard.writeText(`### ${field.name}\n${field.value}`);
		rpgm.forge.logger.visible.log(`Copied "${field.name}" to clipboard!`);
	} catch { return; }
}
</script>

<template>
	<div class="rpgm-homebrew-display-container">
		<p class="rpgm-homebrew-field-flavor-text">
			{{ generations[generation]?.flavor_text }}
		</p>
		<div
			v-if="generation"
			class="rpgm-homebrew-display-fields"
		>
			<div
				v-for="field in generations[generation].fields"
				:key="field.name"
				class="rpgm-homebrew-display-field"
			>
				<div class="rpgm-icons">
					<a
						v-if="isSecure"
						title="Copy to clipboard"
						@click="copy(field)"
					><i class="fa-solid fa-copy" /></a>
				</div>
				<h3>{{ field.name }}</h3>
				<input
					v-if="field.type === 'boolean'"
					type="checkbox"
					style="font-style: normal;"
					:checked="field.value"
				>
				<p v-else>
					{{ field.value }}
				</p>
			</div>
		</div>
	</div>
</template>

<style>
.rpgm-homebrew-field-flavor-text {
	font-style: italic;
	font-size: 17px;
	border-bottom: 2px solid black;
	margin: 0;
}

.rpgm-homebrew-display-fields {
	font-style: italic;
	cursor: text;
}

.rpgm-homebrew-display-fields .rpgm-icons {
	direction: rtl;
	right: 0;
	margin-right: 4px;
}

.rpgm-homebrew-field-flavor-text,
.rpgm-homebrew-display-fields * {
	user-select: text;

	input[type="checkbox"] {
		pointer-events: none;
	}
}

.rpgm-homebrew-display-field:hover .rpgm-icons {
	opacity: 1;
	filter: blur(0px);
	visibility: visible;
}
</style>
