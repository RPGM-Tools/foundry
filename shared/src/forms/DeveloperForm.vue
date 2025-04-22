<script setup lang="ts">
import { ref } from 'vue';

const game = globalThis.game
const rpgm = globalThis.rpgm
const debugEnabled = ref(game.settings.get("rpgm-tools", "debug_mode"))

const submit = () => {
	game.settings.set("rpgm-tools", "debug_mode", debugEnabled.value)
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ rpgm.localize("CONFIG.DEVELOPER_SETTINGS") }}</h2>
			<i>{{ rpgm.localize("CONFIG.DEVELOPER_SETTINGS_SUBTITLE") }}</i>
			<div class="form-group" data-setting-id="rpgm-tools.debug_mode">
				<label>{{ rpgm.localize("CONFIG.DEBUG_MODE") }}</label>
				<div class="form-fields">
					<input v-model="debugEnabled" type="checkbox" data-dtype="String">
				</div>
				<p class="notes">{{ rpgm.localize("CONFIG.DEBUG_MODE_HINT") }}</p>
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
