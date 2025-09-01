<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import ChatWizardContainer from '#/chat/ChatWizardContainer.vue';
import { useSetting } from '#/util';

const init = rpgm.forge.promptChats.useChatWizard();

const localize = rpgm.localize;

const language = useSetting('rpgm-forge.language', true);
const system = useSetting('rpgm-forge.system', true);
const genre = useSetting('rpgm-forge.genre', true);
const method = useSetting('rpgm-forge.method', true);

onMounted(() => {
	void game.settings.set('rpgm-forge', 'has_been_prompted', true);
});

</script>

<template>
	<ChatWizardContainer :wizard="init">
		<div style="padding: 2px;">
			<h2>{{ localize("RPGM_FORGE.INIT.TITLE") }}</h2>
			<h4 style="font-style: italic; border: none; color: #6633cc">
				{{ localize("RPGM_FORGE.INIT.PROMPT1") }}
			</h4>
			<p class="rpgm-links">
				<a
					style="margin-bottom: 8px; display: inline-block;"
					v-html="localize('RPGM_FORGE.INIT.PROMPT2')"
				/>
				<br>
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
			<div>
				<h3>{{ method.name }}</h3>
				<p class="hint notes">
					<i>{{ method.hint }}</i>
				</p>
				<div>
					<select
						v-model="method.value"
						class="rpgm-input"
					>
						<option value="ai">
							{{ localize("RPGM_FORGE.CONFIG.METHOD_AI") }}
						</option>
						<option value="manual">
							{{ localize("RPGM_FORGE.CONFIG.METHOD_SIMPLE") }}
						</option>
					</select>
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
					href="https://www.patreon.com/RPGMTools"
					target="_blank"
				><i class="fa-brands fa-patreon" />Patreon</a>
				<a
					href="https://github.com/RPGMTools/foundry"
					target="_blank"
				><i class="fa-brands fa-github" />Github</a>
				<a
					href="https://discord.gg/NMvGxVEm3r"
					target="_blank"
				><i class="fa-brands fa-discord" />Discord</a>
			</div>
		</div>
	</ChatWizardContainer>
</template>

<style scoped>
.links {
	padding-top: 10px;
	display: flex;
	justify-content: space-between;

	* {
		text-decoration: none;
	}

	i {
		margin-right: 2px;
	}
}
</style>
