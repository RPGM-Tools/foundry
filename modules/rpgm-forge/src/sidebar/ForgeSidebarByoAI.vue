<script setup lang="ts">
import { NCard, NCollapse, NCollapseItem, NFlex, NP, NText, NThing } from 'naive-ui';

import SidebarAccountByoAI from '#/sidebar/SidebarApp/SidebarAccount/SidebarAccountByoAI.vue';

import ModelSelector from './ModelSelector.vue';

const model = computed({
	get() { return rpgm.forge.mod.settings.ai.model; },
	set(v: string) { rpgm.forge.mod.settings.ai.model = v; }
});
const names = computed({
	get() { return rpgm.forge.mod.settings.ai.modelOverrides.names; },
	set(v: string) { rpgm.forge.mod.settings.ai.modelOverrides.names = v; }
});
const descriptions = computed({
	get() { return rpgm.forge.mod.settings.ai.modelOverrides.descriptions; },
	set(v: string) { rpgm.forge.mod.settings.ai.modelOverrides.descriptions = v; }
});
const homebrew = computed({
	get() { return rpgm.forge.mod.settings.ai.modelOverrides.homebrew; },
	set(v: string) { rpgm.forge.mod.settings.ai.modelOverrides.homebrew = v; }
});

const baseModelPlaceholder = computed(() => 'Enter a model slug');

const overridesPlaceholder = computed(() => model.value || baseModelPlaceholder.value);

// Open overrides if any are set
const defaultOpen = computed(() => [names.value, descriptions.value, homebrew.value].some(Boolean) 
	? ['1'] : []);
</script>

<template>
	<NFlex vertical>
		<NCard>
			<SidebarAccountByoAI />
		</NCard>
		<NCard>
			<NThing title="Ai Models">
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
				<NCollapse :default-expanded-names="defaultOpen">
					<ModelSelector
						v-model="model"
						label="Base Text Model"
						:placeholder="baseModelPlaceholder"
					/>
					<NCollapseItem
						title="Model Overrides"
						name="1"
						display-directive="show"
					>
						<NFlex style="padding: var(--n-title-padding)">
							<ModelSelector
								v-model="names"
								label="Names"
								:placeholder="overridesPlaceholder"
							/>
							<ModelSelector
								v-model="descriptions"
								label="Descriptions"
								:placeholder="overridesPlaceholder"
							/>
							<ModelSelector
								v-model="homebrew"
								label="Homebrew"
								:placeholder="overridesPlaceholder"
							/>
						</NFlex>
					</NCollapseItem>
				</NCollapse>
			</NThing>
		</NCard>
	</NFlex>
</template>

<style>
	.n-collapse-item__content-inner {
		padding-top: 0 !important;
	}
</style>
