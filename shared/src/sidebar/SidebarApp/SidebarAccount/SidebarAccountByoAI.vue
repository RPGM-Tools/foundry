<script setup lang="ts">
import type { TextProvider } from '@rpgm/tools';
import { DIY_PROVIDERS } from '@rpgm/tools';
import { useThrottleFn } from '@vueuse/core';
import type { DropdownOption, SelectOption } from 'naive-ui';

import StaggeredTransitionGroup from '#/util/StaggeredTransitionGroup';

const randomID = () => foundry.utils.randomID();	

const clone = <T>(o: T) => JSON.parse(JSON.stringify(o)) as T;

const textAiForm = useTemplateRef('textAiForm');

const typeOptions = Object.entries(DIY_PROVIDERS)
	.map<DropdownOption>(([id, provider]) => ({ 
		label: provider.name,
		key: id,
		icon: () => h('i', { class: provider.classIcon }) 
	}));

const providers = rpgm.settings.ref('textProviders');

const modelCache = reactive<Record<string, SelectOption[]>>({});

const formValue = ref({
	providers: clone(toRaw(providers.value))}
);

const save = () => {
	if (!textAiForm.value) return;

	textAiForm.value.validate()
		.then(() => {
			providers.value = clone(formValue.value.providers);
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
				<StaggeredTransitionGroup
					name="rpgm-stagger"
					appear
					:delay="0"
				>
					<NCard
						v-for="(provider, i) in formValue.providers"
						:key="provider.id"
						title="Provider"
						style="margin-bottom: 8px;"
					>
						<template #header-extra>
							<NButton
								type="error"
								text
								icon-placement="right"
								@click="formValue.providers?.splice(i, 1)"
							>
								<template #icon>
									<i class="fas fa-circle-xmark" />
								</template>
								Remove
							</NButton>
						</template>
						<NFlex>
							<NFormItemRow
								:path="`providers[${i}].type`"
								label="Type"
								:show-feedback="false"
								label-placement="left"
							>
								<NDropdown
									:options="typeOptions"
									@select="e => void (provider.type = e)"
								>
									<NButton
										:key="provider.type"
										type="primary"
										secondary
									>
										{{ DIY_PROVIDERS[provider.type]?.name }}
									</NButton>
								</NDropdown>
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
								:show-require-mark="false"
								:rule="{
									required: true,
									message: 'Please enter an API key.',
									trigger: 'blur'
								}"
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
				</StaggeredTransitionGroup>
				<NFlex>
					<NButton
						type="primary"
						text
						icon-placement="right"
						@click="formValue.providers?.push({id: randomID(), baseURL: '', apiKey: '', name: '', type: 'openai-compatible', textModels: [] })"
					>
						<template #icon>
							<i class="fas fa-circle-plus" />
						</template>
						Add Provider
					</NButton>
					<NButton
						type="primary"
						attr-type="submit"
						secondary
					>
						Save
					</NButton>
				</NFlex>
			</NForm>
		</NThing>
	</NCard>
</template>
