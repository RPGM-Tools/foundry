<script setup lang="ts">
import type { TextProvider } from '@rpgm/tools';
import { DIY_PROVIDERS } from '@rpgm/tools';
import { useThrottleFn } from '@vueuse/core';
import type { SelectOption } from 'naive-ui';
import { onBeforeRouteLeave } from 'vue-router';

const randomID = () => foundry.utils.randomID();	

const clone = <T>(o: T) => JSON.parse(JSON.stringify(o)) as T;

const textAiForm = useTemplateRef('textAiForm');

const randomHue = () => Math.floor(Math.random() * 360).toString();

const typeOptions = Object.entries(DIY_PROVIDERS)
	.map<SelectOption>(([id, provider]) => ({ 
		label: provider.name,
		value: id,
		icon: () => h('i', { class: provider.classIcon }) 
	}));

const providers = rpgm.settings.ref('textProviders');
const saveButton = useTemplateRef('saveButton');

const modelCache = reactive<Record<string, SelectOption[]>>({});

onBeforeRouteLeave(() => {
	if (saved.value) return true;

	if (saveButton.value) saveButton.value.$el.animate([
		{ transform: 'translateX(-4px)' },
		{ transform: 'translateX(4px)' },
		{ transform: 'translateX(-4px)' },
		{ transform: 'translateX(0)' }
	], { duration: 200 });
	return false;
});
const saved = ref(true);

const formValue = ref({
	providers: clone(toRaw(providers.value))
});

watch(formValue, () => {
	saved.value = false;
}, { deep: true });

const save = () => {
	if (!textAiForm.value) return;

	textAiForm.value.validate()
		.then(({ warnings }) => {
			if (warnings?.length) return;
			providers.value = clone(formValue.value.providers);
			saved.value = true;
		}, () => void 0);
};

const reset = () => {
	formValue.value.providers = clone(providers.value);
	nextTick(() => void (saved.value = true));
};

const searchForModel = useThrottleFn(async (provider: TextProvider, search: string) => {
	try {

	const models = await DIY_PROVIDERS[provider.type]?.fetchModels?.({
		apiKey: provider.apiKey,
		baseURL: provider.baseURL
	});
	if (!models) modelCache[provider.id] = [];
	else
		modelCache[provider.id] = models.filter(m => m.includes(search))
			.map<SelectOption>(v => ({label: v, value: v}));
	} catch { void 0; }
}, 10000);
</script>

<template>
	<NCard>
		<NThing
			title="Text AI"
			description="Accepts any OpenAI-compatible api."
		>
			<NForm
				ref="textAiForm"
				:model="formValue"
				@submit.prevent="save"
			>
				<NCard
					v-for="(provider, i) in formValue.providers"
					:key="provider.id"
					title="Provider"
					style="margin-bottom: 8px;"
					:style="{ backgroundColor: `oklch(0.3 0.05 ${provider.hue} / 50%)` }"
				>
					<template #header-extra>
						<NFlex>
							<NButton
								type="primary"
								text
								icon-placement="right"
								@click="provider.hue = randomHue()"
							>
								Color
								<template #icon>
									<i class="fas fa-rotate-reverse" />
								</template>
							</NButton>
							<NPopconfirm
								:positive-button-props="{ type: 'error' }"
								positive-text="Yes, Remove"
								negative-text="Cancel"
								class="rpgm-app"
								@positive-click="formValue.providers?.splice(i, 1)"
							>
								<template #trigger>
									<NButton
										type="error"
										text
										icon-placement="right"
									>
										<template #icon>
											<i class="fas fa-circle-xmark" />
										</template>
										Remove
									</NButton>
								</template>
								Are you sure you want to remove this provider?
							</NPopconfirm>
						</NFlex>
					</template>
					<NFlex>
						<NFormItemRow
							:path="`providers[${i}].type`"
							label="Type"
							:show-feedback="false"
						>
							<NSelect
								v-model:value="provider.type"
								:options="typeOptions"
								style="width: 100%;"
							/>
						</NFormItemRow>
						<NFormItemRow
							label="API Base URL"
							:path="`providers[${i}].baseURL`"
							:show-require-mark="false"
							:rule="{
								required: true,
								message: 'Please enter an API Base URL.',
								trigger: 'blur'
							}"
						>
							<NInput v-model:value="provider.baseURL" />
						</NFormItemRow>
						<NFormItemRow
							label="API Key"
							:path="`providers[${i}].apiKey`"
						>
							<NInput
								v-model:value="provider.apiKey"
								type="password"
							/>
						</NFormItemRow>
						<NFormItemRow
							label="Models"
							:path="`providers[${i}].textModels`"
						>
							<NSelect
								v-model:value="provider.textModels"
								filterable
								tag
								:options="modelCache[provider.id] ?? []"
								multiple
								style="box-shadow: none;"
								@search="(search) => void searchForModel(provider, search)"
							/>
						</NFormItemRow>
					</NFlex>
				</NCard>
				<NFlex vertical>
					<NButton
						type="primary"
						icon-placement="right"
						text
						@click="formValue.providers?.push({
							id: randomID(),
							baseURL: '',
							apiKey: '',
							name: '',
							type: 'openai-compatible',
							textModels: [],
							hue: randomHue()
						})"
					>
						<template #icon>
							<i class="fas fa-circle-plus" />
						</template>
						Add Provider
					</NButton>
					<NButtonGroup
						ref="saveButton"
						style="flex-wrap: wrap;"
					>
						<NButton
							type="primary"
							attr-type="submit"
							:disabled="saved"
							icon-placement="right"
							primary
							style="flex: 1;"
						>
							<template #icon>
								<i class="fas fa-save" />
							</template>
							Save
						</NButton>
						<NButton
							class="rpgm-no-wide"
							type="error"
							:disabled="saved"
							icon-placement="right"
							@click="reset"
						>
							<template #icon>
								<i class="fas fa-circle-xmark" />
							</template>
							Discard Changes
						</NButton>
					</NButtonGroup>
				</NFlex>
			</NForm>
		</NThing>
	</NCard>
</template>
