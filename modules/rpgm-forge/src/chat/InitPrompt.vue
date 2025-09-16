<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import ChatWizardContainer from '#/chat/ChatWizardContainer.vue';
import { useSetting } from '#/util';

const init = rpgm.forge.promptChats.useChatWizard();

const localize = rpgm.localize;

const language = useSetting('rpgm-forge.language', true);
const system = useSetting('rpgm-forge.system', true);
const genre = useSetting('rpgm-forge.genre', true);

Hooks.on('ready', () => {
	void game.settings.set('rpgm-forge', 'has_been_prompted', true);
});

const openSidebar = () => {
	if (rpgm.majorGameVersion <= 12) {
		ui.sidebar.activateTab('rpgm');
	} else {
		ui.sidebar.changeTab('rpgm', 'primary');
	}
};
</script>

<template>
	<ChatWizardContainer :wizard="init">
		<div style="padding: 2px;">
			<h2>{{ localize("RPGM_FORGE.INIT.TITLE") }}</h2>
			<h4 style="font-style: italic; border: none; color: #6633cc">
				{{ localize("RPGM_FORGE.INIT.PROMPT1") }}
			</h4>
			<p class="rpgm-links">
				{{ localize("RPGM_FORGE.INIT.PROMPT3") }}
				<br>
				<i>{{ localize("RPGM_FORGE.INIT.PROMPT4") }}</i>
			</p>
			<div>
				<h3>{{ language.name }}</h3>
				<p class="hint notes">
					<i>{{ language.hint }}</i>
				</p>
				<div>
					<input
						v-model="language.value"
						class="rpgm-input"
						type="text"
					>
				</div>
			</div>
			<div>
				<h3>{{ system.name }}</h3>
				<p class="hint notes">
					<i>{{ system.hint }}</i>
				</p>
				<div>
					<input
						v-model="system.value"
						class="rpgm-input"
						type="text"
					>
				</div>
			</div>
			<div>
				<h3>{{ genre.name }}</h3>
				<p class="hint notes">
					<i>{{ genre.hint }}</i>
				</p>
				<div>
					<input
						v-model="genre.value"
						class="rpgm-input"
						type="text"
					>
				</div>
			</div>
			<div
				class="rpgm-links links"
				style="font-size: 12px;"
			>
				<a
					href="https://rpgm.tools"
					target="_blank"
				><i class="rp-dice" />RPGM.tools</a>
				<a
					href="https://github.com/RPGMTools/foundry"
					target="_blank"
				><i class="fa-brands fa-github" />Github</a>
				<a
					href="https://discord.gg/NMvGxVEm3r"
					target="_blank"
				><i class="fa-brands fa-discord" />Discord</a>
			</div>
			<button
				class="rpgm-button"
				@click="openSidebar"
			>
				{{ localize("RPGM_FORGE.INIT.BUTTON") }}
			</button>
		</div>
	</ChatWizardContainer>
</template>

<style scoped>
.links {
	padding-top: 10px;
	display: flex;
	justify-content: space-around;

	* {
		text-decoration: none;
	}

	i {
		margin-right: 2px;
	}
}
</style>
