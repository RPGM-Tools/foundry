<script setup lang="ts">
import { useSetting } from '#/util';

const autoNameTokens = useSetting('rpgm-forge.auto_name', true);	
const renameActors = useSetting('rpgm-forge.rename_actors', true);
const language = useSetting('rpgm-forge.language', true);
const system = useSetting('rpgm-forge.system', true);
const genre = useSetting('rpgm-forge.genre', true);
</script>

<template>
	<NForm
		:show-feedback="false"
	>
		<NFlex>
			<NFormItemRow
				label="Auto name"
				label-placement="left"
			>
				<NSwitch
					v-model:value="autoNameTokens.value"
					label="Auto name tokens"
				/>
			</NFormItemRow>
			<NP depth="3">
				{{ autoNameTokens.hint }}
			</NP>
			<NFormItemRow
				label="Rename actors"
				label-placement="left"
			>
				<NSwitch
					v-model:value="renameActors.value"
					label="Rename actors"
				/>
			</NFormItemRow>
			<NP depth="3">
				{{ renameActors.hint }}
			</NP>
			<NFormItemRow label="Language">
				<NInput
					v-model:value="language.value"
				/>
			</NFormItemRow>
			<NP depth="3">
				{{ language.hint }}
			</NP>
			<NFormItemRow label="System">
				<NInput
					v-model:value="system.value"
				/>
			</NFormItemRow>
			<NP depth="3">
				{{ system.hint }}
			</NP>
			<NFormItemRow label="Genre">
				<NInput
					v-model:value="genre.value"
				/>
			</NFormItemRow>
			<NP depth="3">
				{{ genre.hint }}
			</NP>
		</NFlex>
	</NForm>
</template>

<style scoped>
	p {
		margin: 0 0 0 10px;
	}
	:deep(.n-form-item-blank) {
		justify-content: end;
	}	
</style>
