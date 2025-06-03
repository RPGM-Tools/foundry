<script setup lang="ts">
import ChatWizardContainer from '#/chat/ChatWizardContainer.vue';
import { useSetting } from '#/util';

const init = rpgm.forge!.promptChats.useChatWizard(), { close } = init;

const localize = rpgm.localize;

const language = useSetting("rpgm-forge.language");
const system = useSetting("rpgm-forge.system");
const genre = useSetting("rpgm-forge.genre");
const method = useSetting("rpgm-forge.method");

const save = () => {
	language.save();
	system.save();
	genre.save();
	method.save();
	game.settings.set("rpgm-forge", "has_been_prompted", true);
	rpgm.forge?.logger.logU(rpgm.localize("RPGM_FORGE.INIT.SAVED"));
	close();
};

</script>

<template>
	<ChatWizardContainer :wizard="init">
		<h2>{{ localize("RPGM_FORGE.INIT.TITLE") }}</h2>
		<p>
			{{ localize("RPGM_FORGE.INIT.PROMPT") }}
			<br>
			<i>{{ localize("RPGM_FORGE.INIT.PROMPT2") }}</i>
		</p>
		<div>
			<h3>{{ language.name }}</h3>
			<p class="hint notes">
				<i>{{ language.hint }}</i>
			</p>
			<div>
				<input v-model="language.value" class="rpgm-input" type="text">
			</div>
		</div>
		<div>
			<h3>{{ system.name }}</h3>
			<p class="hint notes">
				<i>{{ system.hint }}</i>
			</p>
			<div>
				<input v-model="system.value" class="rpgm-input" type="text">
			</div>
		</div>
		<div>
			<h3>{{ genre.name }}</h3>
			<p class="hint notes">
				<i>{{ genre.hint }}</i>
			</p>
			<div>
				<input v-model="genre.value" class="rpgm-input" type="text">
			</div>
		</div>
		<div>
			<h3>{{ method.name }}</h3>
			<p class="hint notes">
				<i>{{ method.hint }}</i>
			</p>
			<div>
				<select v-model="method.value" class="rpgm-input">
					<option value="ai">{{ localize("RPGM_FORGE.CONFIG.METHOD_AI") }}</option>
					<option value="manual">{{ localize("RPGM_FORGE.CONFIG.METHOD_SIMPLE") }}</option>
				</select>
			</div>
		</div>
		<button class="rpgm-button" style="margin-top: 10px" @click="save">{{ localize("RPGM_FORGE.INIT.SAVE")
		}}</button>
	</ChatWizardContainer>
</template>
