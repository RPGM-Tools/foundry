<script setup lang="ts">
import type { TextProvider } from '@rpgm/tools';
import { DIY_PROVIDERS } from '@rpgm/tools';
import { useThrottleFn } from '@vueuse/core';
import type { SelectOption } from 'naive-ui';
import { onBeforeRouteLeave } from 'vue-router';

const randomID = () => foundry.utils.randomID();	

const clone = <T>(o: T) => JSON.parse(JSON.stringify(o)) as T;

const textAiForm = useTemplateRef('textAiForm');

const typeOptions = Object.entries(DIY_PROVIDERS)
	.map<SelectOption>(([id, provider]) => ({ 
		label: provider.name,
		key: id,
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
		});
};

const searchForModel = useThrottleFn(async (provider: TextProvider, search: string) => {
	const models = await DIY_PROVIDERS[provider.type]?.fetchModels?.({
		apiKey: provider.apiKey,
		baseURL: provider.baseURL
	});
	if (!models) modelCache[provider.id] = [];
	else
		modelCache[provider.id] = models.filter(m => m.includes(search))
			.map<SelectOption>(v => ({label: v, value: v}));
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
				>
					<template #header-extra>
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
							label="Base API Key"
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
						@click="formValue.providers?.push({id: randomID(), baseURL: '', apiKey: '', name: '', type: 'openai-compatible', textModels: [] })"
					>
						<template #icon>
							<i class="fas fa-circle-plus" />
						</template>
						Add Provider
					</NButton>
					<NButton
						ref="saveButton"
						:type="saved ? 'primary' : 'warning'"
						attr-type="submit"
						icon-placement="right"
						primary
					>
						<template #icon>
							<i class="fas fa-save" />
						</template>
						Save
					</NButton>
				</NFlex>
			</NForm>
		</NThing>
	</NCard>
</template>
