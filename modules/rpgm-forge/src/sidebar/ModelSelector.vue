<script setup lang="ts">
import { NButton, NFormItemRow, NInput, NTooltip } from 'naive-ui';

import { LoadingBoundry } from '#/util/useLoading';

defineProps<{
	label: string
	placeholder: string
}>();

const model = defineModel<string>({ required: true });

async function testModel() {
	const modelToTest = model.value;
	const v = await rpgm.forge.mod.testModel(modelToTest);
	validatedModel.value = modelToTest;
	if (v.isErr()) {
		valid.value = false;
		rpgm.forge.logger.visible.error(v.error.message);
		return;
	}
	valid.value = v.value;
	if (v.value) {
		rpgm.forge.logger.visible.log('Model verification successful!');
	} else {
		rpgm.forge.logger.visible.error('Model verification failed!');
	}
}

// What model was last tested
const validatedModel = ref<string>();
// Whether the last test was successful
const valid = ref<boolean>();

const feedback = computed(() => validatedModel.value && validatedModel.value === model.value ? valid.value ? 'Valid model' : 'Invalid model!' : undefined);
const validStatus = computed(() => validatedModel.value && validatedModel.value === model.value && !valid.value ? 'error' : 'success');
</script>

<template>
	<NFormItemRow
		:label
		:feedback="feedback"
		:validation-status="validStatus"
		:show-feedback="feedback !== undefined"
	>
		<LoadingBoundry #="{ loading, start }">
			<NInput
				v-model:value="model"
				:loading="loading.value || undefined"
				:placeholder
			>
				<template
					v-if="model"
					#suffix
				>
					<NTooltip>
						<template #trigger>
							<NButton
								text
								style="width: unset"
								:disabled="loading.value"
								@click="start(testModel())"
							>
								<i class="fa-regular fa-circle-play" />
							</NButton>
						</template>
						<span>Test connection</span>
					</NTooltip>
				</template>
			</NInput>
		</LoadingBoundry>
	</NFormItemRow>
</template>
