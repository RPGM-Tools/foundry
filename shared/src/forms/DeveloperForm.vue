<script setup lang="ts">
import { useGame, localize } from '#/util/util'
import { ref } from 'vue';

const game = useGame()
const debugEnabled = ref(game.settings.get("rpgm-tools", "debug_mode"))

const submit = () => {
	game.settings.set("rpgm-tools", "debug_mode", debugEnabled.value)
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ localize("RPGM.CONFIG.DEVELOPER_SETTINGS") }}</h2>
			<i>{{ localize("RPGM.CONFIG.DEVELOPER_SETTINGS_SUBTITLE") }}</i>
			<div class="form-group" data-setting-id="rpgm-tools.debug_mode">
				<label>{{ localize("RPGM.CONFIG.DEBUG_MODE") }}</label>
				<div class="form-fields">
					<input v-model="debugEnabled" type="checkbox" data-dtype="String">
				</div>
				<p class="notes">{{ localize("RPGM.CONFIG.DEBUG_MODE_HINT") }}</p>
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
