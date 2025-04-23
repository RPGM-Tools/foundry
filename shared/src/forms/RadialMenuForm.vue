<script setup lang="ts">
import { useSetting } from '#/util';

const rpgm = globalThis.rpgm
const radialMenuEnabled = useSetting("rpgm-tools", "radial_menu_enabled")

const submit = () => {
	radialMenuEnabled.apply()
	rpgm.radialMenu.update()
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ rpgm.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS") }}</h2>
			<i>{{ rpgm.localize("RPGM.CONFIG.RADIAL_MENU_SETTINGS_SUBTITLE") }}</i>
			<div class="form-group">
				<label>{{ radialMenuEnabled.name }}</label>
				<div class="form-fields">
					<input v-model="radialMenuEnabled.value" type="checkbox">
				</div>
				<p class="notes">{{ radialMenuEnabled.hint }}</p>
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
