<script setup lang="ts">
import { type TextModel } from '@rpgm/tools';
import { RPGM_MODELS } from '@rpgm/tools/forge';
import { NCard } from 'naive-ui';

import RadialCenter from '#/radial-menu/RadialCenter.vue';
import DiceIcon from '#/style/components/DiceIcon.vue';
import { vFitLines } from '#/util/VFitLines';

import ModeSwitcher from './ModeSwitcher.vue';

const names = rpgm.forge.settings.ref('namesModel');

const namesModel = ref<ModelOption>(names.value ? {
	id: names.value.slug,
	value: names.value,
	icon: names.value.provider === 'rpgm' ? 'rpgm' : 'success'
} : {
		id: 'rpgm-names',
		value: RPGM_MODELS.names,
		icon: 'rpgm'
	});

watch(namesModel, v => {if (v) names.value = v.value; });

type ModelOption = { id: string, icon: 'rpgm' | 'success', value: TextModel };
const textModelOptions = computed(() => rpgm.settings.get('textProviders')?.reduce((acc, provider) => {
	acc.push(...provider.textModels.map<ModelOption>(m => {
		return {
			id: m,
			value: {
				type: 'text',
				provider: provider.id,
				slug: m
			},
			icon: 'success'
		};
	}));
	return acc;
}, [
		{
			id: RPGM_MODELS.names.slug,
			value: RPGM_MODELS.names,
			icon: 'rpgm'
		}
	] as ModelOption[]) ?? []);
</script>

<template>
	<NFlex vertical>
		<NCard ref="card">
			<NThing title="Text Models">
				<template #description>
					<NP>
						Here you can select the text AI model(s) to use for Forge.
						<br>
						<NText
							italic
							type="warning"
						>
							Reasoning models will consume more tokens.
						</NText>
					</NP>
				</template>
				<NCollapse expanded-names="1">
					<NCollapseItem
						title="Model Overrides"
						name="1"
						display-directive="show"
					>
						<NFlex style="padding: var(--n-title-padding)">
							<NFormItem
								label-align="center"
								label="Names"
								style="width: 100%;"
							>
								<NH2
									v-fit-lines
									style="border: 0; overflow: hidden; padding: 6px;"
								>
									{{ names?.slug || '' }}
								</NH2>
								<ModeSwitcher
									v-model="namesModel"
									:options="textModelOptions"
									style="width: 48px; height: 48px; position: relative; margin-left: auto;"
									option-key="id"
								>
									<template #default="{ value, isOpen, selected }">
										<span
											class="model-label"
											:data-open="isOpen"
											:class="{ selected }"
										>{{ value.id }}</span>
										<RadialCenter tabindex="-1">
											<DiceIcon :type="value.icon" />
										</RadialCenter>
									</template>
									<template #socket>
										<RadialCenter tabindex="-1" />
									</template>
								</ModeSwitcher>
							</NFormItem>
						</NFlex>
					</NCollapseItem>
				</NCollapse>
			</NThing>
		</NCard>
	</NFlex>
</template>

<style scoped>
:deep(.n-collapse-item__content-inner) {
	padding-top: 0 !important;
}

.model-label {
	position: absolute;
	right: 110%;
	white-space: nowrap;
	top: 50%;
	transform: translateY(-50%);
	transition: all 0.2s ease-out;
	background: rgb(0 0 0 / 85%);
	padding: 2px 4px;
	border-radius: 4px;

	&[data-open="false"] {
		visibility: hidden;
		opacity: 0;
	}
	&.selected {
		font-weight: bold;
	}
}
</style>
