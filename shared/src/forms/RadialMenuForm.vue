<script setup lang="ts">
import { useGame, localize } from '#/util/util'
import { ref } from 'vue';

const game = useGame()
const radialMenuEnabled = ref(game.settings.get("rpgm-tools", "radial_menu_enabled"))

const submit = () => {
	game.settings.set("rpgm-tools", "radial_menu_enabled", radialMenuEnabled.value)
	rpgm.radialMenu.update()
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS") }}</h2>
			<i>{{ localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS_SUBTITLE") }}</i>
			<div class="form-group" data-setting-id="rpgm-tools.api_key">
				<label>{{ localize("RPGM.CONFIG.RADIAL_MENU_ENABLED") }}</label>
				<div class="form-fields">
					<input v-model="radialMenuEnabled" type="checkbox" data-dtype="String">
				</div>
				<p class="notes">{{ localize("RPGM.CONFIG.RADIAL_MENU_ENABLED_HINT") }}</p>
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
