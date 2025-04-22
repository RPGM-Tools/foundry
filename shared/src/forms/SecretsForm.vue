<script setup lang="ts">
import { ref } from 'vue';

const rpgm = globalThis.rpgm
const game = globalThis.game
const api_key = ref(game.settings.get("rpgm-tools", "api_key"))

const submit = () => {
	game.settings.set("rpgm-tools", "api_key", api_key.value)
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ rpgm.localize("RPGM.CONFIG.SECRETS_SETTINGS") }}</h2>
			<i>{{ rpgm.localize("RPGM.CONFIG.SECRETS_SETTINGS_SUBTITLE") }}</i>
			<div class="form-group" data-setting-id="rpgm-tools.api_key">
				<label>{{ rpgm.localize("RPGM.CONFIG.API_KEY") }}</label>
				<div class="form-fields">
					<input v-model="api_key" type="password" name="rpgm-tools.api_key" data-dtype="String">
				</div>
				<p class="notes">{{ rpgm.localize("RPGM.CONFIG.API_KEY_HINT") }}</p>
			</div>
		</div>
		<footer>
			<button type="submit">
				<i class="fas fa-save"></i>
				Save Changes
			</button>
		</footer>
	</form>
</template>
