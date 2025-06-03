<script setup lang="ts">
import { ForgeHomebrew } from "@rpgm/forge";
import ComboBox from "#/util/ComboBox.vue";
import HomebrewInput from "./HomebrewInput.vue";
import HomebrewDisplay from "./HomebrewDisplay.vue";
import HomebrewTitle from "./HomebrewTitle.vue";
import RadialMenu from "#/radial-menu/RadialMenu.vue";
import { inputHeuristics } from "#/radial-menu";
import ChatWizardContainer from "#/chat/ChatWizardContainer.vue";

const schemas = rpgm.forge!.homebrewSchemas;

const modified = ref(false);
const editing = ref(true);
const currentTitle = computed<string>(() => {
	if (editing.value)
		return data.options.schema?.name ?? "";
	else
		return data.generations[data.activeGeneration]?.custom_name ?? "";
});
const homebrew = rpgm.forge!.homebrewChats.useChatWizard(), { data, id } = homebrew;
const loading = ref(false);

const hasGenerated = computed(() => Object.keys(data.generations).length > 0);

const buttonAnchor = useTemplateRef("buttonAnchor");

watch(buttonAnchor, (r) => { if (r) buttonContext.element = r.closest(".chat-message")!; });

const buttonContext = shallowReactive({
	element: buttonAnchor.value!,
	loading: false,
	shift: false,
});

const buttons = computed<RadialButton[]>(() =>
	editing.value ? [] :
		[
			{
				category: rpgm.radialMenu.categories.rpgm_forge,
				icon: "fa-solid fa-copy",
				tooltip: "RPGM_FORGE.RADIAL_MENU.COPY",
				detective() { return window.isSecureContext; },
				callback() { copyGeneration(data.activeGeneration); },
			},
			{
				category: rpgm.radialMenu.categories.rpgm_forge,
				icon: "fas fa-book-open",
				tooltip: "RPGM_FORGE.RADIAL_MENU.SEND_TO_JOURNAL",
				detective() {
					//@ts-expect-error Flags broken
					return game.journal.find(j => j.getFlag("rpgm-forge", "homebrew") === id)
						//@ts-expect-error Flags broken
						?.pages.find(e => e.getFlag("rpgm-forge", "homebrew") === data.activeGeneration) === undefined;
				},
				callback(c) { sendToJournal(data.activeGeneration, c.shift); },
			},
			{
				category: rpgm.radialMenu.categories.rpgm_forge,
				icon: "fas fa-book-open",
				tooltip: "RPGM_FORGE.RADIAL_MENU.OPEN_JOURNAL",
				detective() {
					//@ts-expect-error Flags broken
					return game.journal.find(j => j.getFlag("rpgm-forge", "homebrew") === id)
						//@ts-expect-error Flags broken
						?.pages.find(e => e.getFlag("rpgm-forge", "homebrew") === data.activeGeneration) !== undefined;
				},
				callback() {
					//@ts-expect-error Flags broken
					const entry = game.journal.find(j => j.getFlag("rpgm-forge", "homebrew") === id);
					//@ts-expect-error Flags broken
					entry?.pages.find(e => e.getFlag("rpgm-forge", "homebrew") === data.activeGeneration)?.sheet.render(true);
				},
			},
			{
				category: rpgm.radialMenu.categories.rpgm_forge,
				icon: "fa-solid fa-trash",
				tooltip: "RPGM_FORGE.RADIAL_MENU.DELETE",
				callback() { deleteGeneration(data.activeGeneration); },
			},
			{
				category: rpgm.radialMenu.categories.rpgm_debug,
				icon: "fa-regular fa-info-circle",
				tooltip: "RPGM_TOOLS.RADIAL_MENU.INFO",
				detective(c) { return inputHeuristics(c as InputContext).isDebug().result; },
				callback() { rpgm.logger.debug(data, id); },
			},
		]);

provide("data", data);

onMounted(() => {
	if (data.activeGeneration && data.generations[data.activeGeneration]) {
		editing.value = false;
	} else if (!data.options.schema) {
		data.options.schema = structuredClone(schemas[Math.floor(Math.random() * schemas.length)]);
	}
});

/**
 * @param generation - The generation to send to journal
 * @param open - Whether or not to show the entry after creating it
 */
async function sendToJournal(generation: string, open: boolean = false) {
	const gen = data.generations[generation];

	//@ts-expect-error Flags broken
	let entry = game.journal.find(j => j.getFlag("rpgm-forge", "homebrew") === id) as JournalEntry;
	if (!entry) {
		entry = (await JournalEntry.create({
			name: gen.name,
			//@ts-expect-error Flags broken
			flags: { "rpgm-forge": { "homebrew": id } }
		}))!;
	}

	//@ts-expect-error Flags broken
	let page = entry.pages.find(e => e.getFlag("rpgm-forge", "homebrew") === generation) as JournalEntryPage;
	if (!page) {
		page = (await JournalEntryPage.create({
			name: gen.custom_name,
			text: {
				content: `*${gen.flavor_text}*\n${gen.fields.map(f => `## ${f.name}\n${f.value}`).join('\n')}`,
				markdown: `*${gen.flavor_text}*\n${gen.fields.map(f => `## ${f.name}\n${f.value}`).join('\n')}`,
				format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.MARKDOWN,
			},
			// Puts the newest entry on top, may change later
			sort: entry.pages.reduce((m, e) => { return e.sort < m ? (m = e.sort) : m; }, 0) - 1,
			//@ts-expect-error Flags broken
			flags: { "rpgm-forge": { "homebrew": generation } }
		}, { parent: entry }))!;
		if (open)
			page.sheet?.render(true);
		rpgm.logger.logU(`Journal Entry created for "${gen.custom_name}"`,);
	} else {
		rpgm.logger.errorU(`Journal Entry for "${gen.custom_name}" already exists!`);
	}
}

/** Reset modified status, scroll down if necessary */
function newSelection() {
	modified.value = false;
	rpgm.chat.updateScroll();
}

/** @param generation - The generation to delete */
function deleteGeneration(generation: string) {
	delete data.generations[generation];
	if (Object.entries(data.generations).length > 0) {
		cycleGenerations();
	} else {
		editing.value = true;
	}
}

/**
 * Generates the homebrew
 */
async function generate() {
	if (!data.options.schema) return;
	if (!data.options.schema?.fields.length) return;
	loading.value = true;

	const result = await rpgm.forge!.queue.generate(ForgeHomebrew, data.options as HomebrewOptions);

	if (result.success) {
		rpgm.chat.updateScroll();

		const id = foundry.utils.randomID();
		data.generations[id] = result.output;
		data.activeGeneration = id;
		editing.value = false;
	}
	else
		rpgm.forge?.logger.errorU(result.error);
	loading.value = false;
}

/**
 * Sets the active schema to a copy of {@link v}
 * @param v - The schema to select
 * @returns The new schema
 */
function assign(v: HomebrewSchema): HomebrewSchema {
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

/**
 * Copies a generation to the clipboard
 * @param generation - The generation to copy
 */
function copyGeneration(generation: string) {
	try {
		const gen = data.generations[generation];
		void navigator.clipboard.writeText(`# ${gen.custom_name}\n*${gen.flavor_text}*\n${gen.fields.map(f => `## ${f.name}\n${f.value}`).join('\n')}`);
		rpgm.forge!.logger.logU(`Copied ${gen.name} to clipboard`);
	} catch { return; }
}

/** Switches the wizard to the editing view, creating an empty schema from the active generation */
function restoreSchemaFromActiveGeneration() {
	if (editing.value) return;
	data.options = {
		system: rpgm.forge!.system,
		genre: rpgm.forge!.genre,
		language: rpgm.forge!.language,
		schema: {
			name: data.generations[data.activeGeneration].name,
			fields: [
				...data.generations[data.activeGeneration].fields.map(f => ({ name: f.name, type: f.type, description: f.description })),
			]
		},
	};
	modified.value = true;
	editing.value = true;
	rpgm.chat.updateScroll();
}
</script>

<template>
	<ChatWizardContainer :wizard="homebrew">
		<RadialMenu v-if="buttonContext.element" v-model="buttonContext" :buttons :pad-document="false" :right="true"
			:top="true" :padding="{ top: 40, right: 0 }" />
		<HomebrewTitle ref="titleRef" v-model="currentTitle" :modified="modified && editing"
			:can-goto-generations="hasGenerated" :editing @cycle="cycleGenerations" @goto-generations="gotoGenerations"
			@click="restoreSchemaFromActiveGeneration" />
		<ComboBox v-if="!hasGenerated" v-model="data.options.schema" placeholder="Preset" :values="schemas"
			:unique="v => v.name" :display="v => v.name" :assign
			:filter="(v, t) => v.name.toLowerCase().startsWith(t.toLowerCase())" @update:model-value="newSelection" />
		<div ref="buttonAnchor" class="rpgm-homebrew-content">
			<Transition name="rpgm-homebrew-main">
				<div v-if="editing">
					<HomebrewInput v-model:modified="modified" v-model="data.options.schema" :loading @generate="generate" />
				</div>
				<div v-else-if="!editing">
					<Transition name="rpgm-homebrew-main">
						<HomebrewDisplay :key="data.activeGeneration" :generation="data.activeGeneration" />
					</Transition>
				</div>
			</Transition>
		</div>
	</ChatWizardContainer>
</template>

<style>
.rpgm-homebrew-content {
	position: relative;
	margin-top: 5px;
	max-height: 50vh;
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
