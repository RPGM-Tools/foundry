<script setup lang="ts">
import { useSetting } from '#/util';

const localize = rpgm.localize;

const { message } = rpgm.forge!.initPrompts.useChatWizard();

const language = useSetting("rpgm-forge.language");
const system = useSetting("rpgm-forge.system");
const genre = useSetting("rpgm-forge.genre");
const method = useSetting("rpgm-forge.method");

const save = () => {
	language.save();
	system.save();
	genre.save();
	method.save();
	//@ts-expect-error Never
	message.delete({});
	game.settings.set("rpgm-forge", "has_been_prompted", true);
	rpgm.forge?.logger.logU(rpgm.localize("RPGM_FORGE.INIT.SAVED"));
};

</script>

<template>
	<h3>{{ localize("RPGM_FORGE.INIT.TITLE") }}</h3>
	<p>
		{{ localize("RPGM_FORGE.INIT.PROMPT") }}
		<br>
		<i>{{ localize("RPGM_FORGE.INIT.PROMPT2") }}</i>
	</p>
	<div>
		<label>{{ language.name }}</label>
		<div>
			<input v-model="language.value" class="rpgm-input" type="text">
		</div>
		<p class="hint notes">
			<i>{{ language.hint }}</i>
		</p>
	</div>
	<div>
		<label>{{ system.name }}</label>
		<div>
			<input v-model="system.value" class="rpgm-input" type="text">
		</div>
		<p class="hint notes">
			<i>{{ system.hint }}</i>
		</p>
	</div>
	<div>
		<label>{{ genre.name }}</label>
		<div>
			<input v-model="genre.value" class="rpgm-input" type="text">
		</div>
		<p class="hint notes">
			<i>{{ genre.hint }}</i>
		</p>
	</div>
	<div>
		<label>{{ method.name }}</label>
		<div>
			<input v-model="method.value" class="rpgm-input" type="text">
		</div>
		<p class="hint notes">
			<i>{{ method.hint }}</i>
		</p>
	</div>
	<button class="rpgm-button" @click="save">{{ localize("RPGM_FORGE.INIT.SAVE") }}</button>
</template>
