<script setup lang="ts">
import type { TextProvider} from '@rpgm/tools';
import { type TextModel } from '@rpgm/tools';
import { RPGM_MODELS } from '@rpgm/tools/forge';

import RadialCenter from '#/radial-menu/RadialCenter.vue';
import DiceIcon from '#/style/components/DiceIcon.vue';

import ModeSwitcher from './ModeSwitcher.vue';

const session = rpgm.auth.useSession();

const names = rpgm.forge.settings.ref('namesModel');
const descriptions = rpgm.forge.settings.ref('descriptionsModel');
const homebrew = rpgm.forge.settings.ref('homebrewModel');

const anyRpgmSelected = computed(() => {
	return names.value?.provider === 'rpgm-tools'
		|| descriptions.value?.provider === 'rpgm-tools'
		|| homebrew.value?.provider === 'rpgm-tools';
});

const getProvider = (id: string) => {
	const p = rpgm.settings.get('textProviders').find(p => p.id === id);
	return p;
};

const handleRpgmIcon = (icon: 'rpgm' | 'basic' | 'offline') => icon === 'rpgm' && !session.value.data ? 'warning' as const : icon;

function hydrateModelList(TextProviders: TextProvider[], models: ModelOption[]) {
	return TextProviders.reduce((acc, provider) => {
		acc.push(...provider.textModels.map<ModelOption>(m => {
			return {
				id: m,
				value: {
					type: 'text',
					provider: provider.id,
					slug: m
				},
				icon: 'basic'
			};
		}));
		return acc;
	}, models);
}

type ModelOption = { id: string, icon: 'rpgm' | 'basic' | 'offline', value: TextModel };
const namesModelOptions = computed(() => {
	const models: ModelOption[] = [{
		id: RPGM_MODELS.names.slug,
		value: RPGM_MODELS.names,
		icon: 'rpgm'
	}];
	hydrateModelList(rpgm.settings.get('textProviders') ?? [], models);
	models.push({icon: 'offline', id: 'rpgm-names-offline', value: {
		type: 'text',
		provider: 'offline',
		slug: 'rpgm-names-offline'
	}});
	return models;
});

const descriptionsModelOptions = computed(() => {
	const models: ModelOption[] = [{
		id: RPGM_MODELS.descriptions.slug,
		value: RPGM_MODELS.descriptions,
		icon: 'rpgm'
	}];
	hydrateModelList(rpgm.settings.get('textProviders') ?? [], models);
	return models;
});

const homebrewModelOptions = computed(() => {
	const models: ModelOption[] = [{
		id: RPGM_MODELS.homebrew.slug,
		value: RPGM_MODELS.homebrew,
		icon: 'rpgm'
	}];
	hydrateModelList(rpgm.settings.get('textProviders') ?? [], models);
	return models;
});

const namesModel = ref<ModelOption>(names.value ? {
	id: names.value.slug,
	value: names.value,
	icon: ['rpgm', 'offline'].includes(names.value.provider) ? names.value.provider as 'rpgm' | 'offline' : 'basic'
} : {
		id: 'rpgm-names',
		value: RPGM_MODELS.names,
		icon: 'rpgm'
	});

const descriptionsModel = ref<ModelOption>(descriptions.value ? {
	id: descriptions.value.slug,
	value: descriptions.value,
	icon: descriptions.value.provider === 'rpgm' ? 'rpgm' : 'basic'
} : {
		id: 'rpgm-descriptions',
		value: RPGM_MODELS.descriptions,
		icon: 'rpgm'
	});

const homebrewModel = ref<ModelOption>(homebrew.value ? {
	id: homebrew.value.slug,
	value: homebrew.value,
	icon: homebrew.value.provider === 'rpgm' ? 'rpgm' : 'basic'
} : {
		id: 'rpgm-homebrew',
		value: RPGM_MODELS.homebrew,
		icon: 'rpgm'
	});
</script>

<template>
	<div ref="card">
		<NFlex vertical>
			<NP>
				Here you can select the text AI models to use for Forge.
				<NText
					italic
					type="warning"
				>
					Reasoning models will consume more tokens.
				</NText>
			</NP>
			<NCollapseTransition :show="anyRpgmSelected && !session.data">
				<NAlert
					:show-icon="false"
					type="warning"
				>
					<NFlex vertical>
						You have selected an RPGM model, but you are not signed in.
						Please sign in to use RPGM Tools models.
						<RouterLink
							to="/account?back=true"
							custom
							#="{ navigate }"
						>
							<NButton
								type="warning"
								secondary
								@click="navigate"
							>
								Sign
								In
							</NButton>
						</RouterLink>
					</NFlex>
				</NAlert>
			</NCollapseTransition>
			<NFlex vertical>
				<NDivider style="margin: 0;">
					Names
				</NDivider>
				<ModeSwitcher
					v-model="namesModel"
					:options="namesModelOptions"
					style="width: 48px; height: 48px; position: relative; margin-right: auto;"
					option-key="id"
					@update:model-value="names = $event?.value ?? names"
				>
					<template #default="{ value, isOpen, selected }">
						<RadialCenter inert>
							<DiceIcon
								:type="handleRpgmIcon(value.icon)"
								:style="{filter: value.icon === 'basic' ? `brightness(1.1) hue-rotate(${parseInt(getProvider(value.value.provider)?.hue ?? '0') - 30}deg)` : ''}"
							/>
						</RadialCenter>
						<NText
							code
							class="model-label"
							:data-open="isOpen"
							:class="{ selected }"
						>
							{{ value.id }}
						</NText>
					</template>
					<template #socket>
						<RadialCenter inert />
					</template>
				</ModeSwitcher>
				<NDivider style="margin: 0;">
					Descriptions
				</NDivider>
				<ModeSwitcher
					v-model="descriptionsModel"
					:options="descriptionsModelOptions"
					style="width: 48px; height: 48px; position: relative; margin-right: auto;"
					option-key="id"
					@update:model-value="descriptions = $event?.value ?? descriptions"
				>
					<template #default="{ value, isOpen, selected }">
						<RadialCenter inert>
							<DiceIcon
								:type="handleRpgmIcon(value.icon)"
								:style="{filter: value.icon === 'basic' ? `brightness(1.1) hue-rotate(${parseInt(getProvider(value.value.provider)?.hue ?? '0') - 30}deg)` : ''}"
							/>
						</RadialCenter>
						<NText
							code
							class="model-label"
							:data-open="isOpen"
							:class="{ selected }"
						>
							{{ value.id }}
						</NText>
					</template>
					<template #socket>
						<RadialCenter inert />
					</template>
				</ModeSwitcher>
				<NDivider style="margin: 0;">
					Homebrew
				</NDivider>
				<ModeSwitcher
					v-model="homebrewModel"
					:options="homebrewModelOptions"
					style="width: 48px; height: 48px; position: relative; margin-right: auto;"
					option-key="id"
					@update:model-value="homebrew = $event?.value ?? homebrew"
				>
					<template #default="{ value, isOpen, selected }">
						<RadialCenter
							inert
						>
							<DiceIcon
								:type="handleRpgmIcon(value.icon)"
								:style="{filter: value.icon === 'basic' ? `brightness(1.1) hue-rotate(${parseInt(getProvider(value.value.provider)?.hue ?? '0') - 30}deg)` : ''}"
							/>
						</RadialCenter>
						<NText
							code
							class="model-label"
							:data-open="isOpen"
							:class="{ selected }"
						>
							{{ value.id }}
						</NText>
					</template>
					<template #socket>
						<RadialCenter inert />
					</template>
				</ModeSwitcher>
			</NFlex>
		</NFlex>
	</div>
</template>

<style scoped>
p {
	margin: 0;
}

:deep(.n-collapse-item__content-inner) {
	padding-top: 0 !important;
}

.model-label {
	position: absolute;
	left: 110%;
	top: 50%;
	max-width: 220px;
	width: max-content;
	transform: translateY(-50%);
	transition: all 0.2s ease-out;
	padding: 2px 4px;
	border-radius: 4px;

	&[data-open="true"] {
		background: rgb(0 0 0 / 85%);
	}
	&[data-open="false"]:not(.selected) {
		visibility: hidden;
		opacity: 0;
	}
	&.selected {
		font-weight: bold;
	}
}

:deep(.n-form-item-blank) {
	min-height: 100%;
	height: 100%;
	align-items: center;
	justify-content: center;
}
</style>
