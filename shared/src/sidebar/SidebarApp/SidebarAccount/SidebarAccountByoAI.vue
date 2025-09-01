<script setup lang="ts">
	import { NThing, NFlex, NForm, NFormItemRow, NInput } from 'naive-ui';

	const baseURL = toRef(rpgm.tools.settings.ai, 'baseURL');
	const apiKey = toRef(rpgm.tools.settings.ai, 'apiKey');
</script>

<template>
	<NThing title="Text AI" description="Accepts any OpenAI-compatible api.">
		<NForm>
			<NFlex>
				<NFormItemRow label="AI URL" :show-feedback="false">
					<NInput v-model:value="baseURL" />
				</NFormItemRow>
				<NFormItemRow label="Base API Key" :show-feedback="false">
					<NInput
						v-model:value="apiKey"
						type="password"
					/>
				</NFormItemRow>
			</NFlex>
		</NForm>
	</NThing>
</template>
