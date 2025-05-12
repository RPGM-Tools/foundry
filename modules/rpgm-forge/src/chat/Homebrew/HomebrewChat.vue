<script setup lang="ts">
import { ForgeHomebrew } from "@rpgm/forge";
import Homebrews from "@rpgm/forge/data/schemas.json?url";
import ComboBox from "#/util/ComboBox.vue";
import HomebrewInput from "./HomebrewInput.vue";
import HomebrewDisplay from "./HomebrewDisplay.vue";
import HomebrewTitle from "./HomebrewTitle.vue";

const schemas = ref<HomebrewOptions[]>([]);

const modified = ref(false);
const editing = ref(true);
const currentTitle = computed<string>(() => {
	if (editing.value)
		return data.schema ?
			modified.value ? `${data.schema?.name ?? "gak1"} *`
				: `${data.schema?.name ?? "gak2"}`
			: "";
	else
		return data.generations[data.activeGeneration]?.custom_name ?? "gak4";
});
const { data } = rpgm.forge!.homebrewChats.useChatDatabase();
const loading = ref(false);

const hasGenerated = computed(() => Object.keys(data.generations).length > 0);

provide("data", data);

onMounted(async () => {
	schemas.value = await (await fetch(Homebrews)).json() as unknown as HomebrewOptions[];
	if (data.activeGeneration && data.generations[data.activeGeneration]) {
		editing.value = false;
	}
	// If the homebrew was just created
	if (!data.schema) {
		data.schema = schemas.value[Math.random() * schemas.value.length | 0];
		rpgm.chat.updateScroll(true);
	}
});

/** Reset modified status, scroll down if necessary */
function newSelection() {
	modified.value = false;
	rpgm.chat.updateScroll();
}

/**
 * Generates the homebrew
 */
async function generate() {
	if (!data.schema) return;
	loading.value = true;
	const response = await ForgeHomebrew.fromOptions(data.schema).generate({
		auth_token: game.settings.get("rpgm-tools", "api_key")
	});

	if (response.success) {
		rpgm.chat.updateScroll();

		const id = foundry.utils.randomID();
		data.generations[id] = response.output;
		data.activeGeneration = id;
		editing.value = false;
	}
	else
		rpgm.forge?.logger.errorU(response.error);
	loading.value = false;
}

/**
 * Sets the active schema to a copy of {@link v}
 * @param v - The schema to select
 * @returns The new schema
 */
function assign(v: HomebrewOptions): HomebrewOptions {
	return structuredClone(toRaw(v));
}

/**
 * Select the next generation, wrapping if necessary
 * @param by - How many generations to move forwards or backwards
 */
function cycleGenerations(by: number = 1) {
	const keys = Object.keys(data.generations);
	const index = keys.indexOf(data.activeGeneration);
	const newIndex = (index + keys.length + by) % keys.length;
	data.activeGeneration = keys[newIndex];
}

/** Switches the wizard to the generations view */
function gotoGenerations() {
	if (!data.generations[data.activeGeneration]) {
		data.activeGeneration = Object.keys(data.generations)[0];
	}
	editing.value = false;
}

/** Switches the wizard to the editing view, creating an empty schema from the active generation */
function restoreSchemaFromActiveGeneration() {
	if (editing.value) return;
	data.schema = {
		name: data.generations[data.activeGeneration].name,
		fields: [
			...data.generations[data.activeGeneration].fields.map(f => ({ name: f.name, type: f.type, description: f.description })),
		],
	};
	modified.value = true;
	editing.value = true;
	rpgm.chat.updateScroll();
}
</script>

<template>
	<HomebrewTitle @cycle="cycleGenerations" :can-goto-generations="hasGenerated" @goto-generations="gotoGenerations"
		@click="restoreSchemaFromActiveGeneration" :editing :current-title="currentTitle" />
	<ComboBox @update:model-value="newSelection" v-model="data.schema" v-if="!hasGenerated" :values="schemas"
		:unique="v => v.name" :display="v => v.name" :assign
		:filter="(v, t) => v.name.toLowerCase().startsWith(t.toLowerCase())" />
	<div class="rpgm-homebrew-content">
		<Transition name="rpgm-homebrew-main">
			<div v-if="editing">
				<HomebrewInput v-model:modified="modified" :loading v-model="data.schema" @generate="generate" />
			</div>
			<div v-else-if="!editing">
				<Transition name="rpgm-homebrew-main">
					<HomebrewDisplay :key="data.activeGeneration" :generation="data.generations[data.activeGeneration]" />
				</Transition>
			</div>
		</Transition>
	</div>
</template>

<style>
.rpgm-homebrew-content {
	position: relative;
	max-height: 40vh;
	overflow-y: auto;
	overflow-x: hidden;
	padding-bottom: 10px;
}

.rpgm-homebrew-main-leave-active {
	position: absolute;
}

.rpgm-homebrew-main-leave-active,
.rpgm-homebrew-main-enter-active {
	transition: all 0.5s ease;
}

.rpgm-homebrew-main-leave-to,
.rpgm-homebrew-main-enter-from {
	opacity: 0;
}

.rpgm-homebrew-main-leave-from,
.rpgm-homebrew-main-enter-to {
	opacity: 1;
}
</style>
