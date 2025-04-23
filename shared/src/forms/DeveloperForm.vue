<script setup lang="ts">
import { useSetting } from '#/util';

const rpgm = globalThis.rpgm
const verboseLogs = useSetting("rpgm-tools", "verbose-logs")
const radialMenuDebug = useSetting("rpgm-tools", "radial_menu_debug")

const submit = () => {
	verboseLogs.apply()
	radialMenuDebug.apply()
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ rpgm.localize("RPGM.CONFIG.DEVELOPER_SETTINGS") }}</h2>
			<i>{{ rpgm.localize("RPGM.CONFIG.DEVELOPER_SETTINGS_SUBTITLE") }}</i>
			<div class="form-group">
				<label>{{ verboseLogs.name }}</label>
				<div class="form-fields">
					<input v-model="verboseLogs.value" type="checkbox">
				</div>
				<p class="notes">{{ verboseLogs.hint }}</p>
			</div>
			<div class="form-group">
				<label>{{ radialMenuDebug.name }}</label>
				<div class="form-fields">
					<input v-model="radialMenuDebug.value" type="checkbox">
				</div>
				<p class="notes">{{ radialMenuDebug.hint }}</p>
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
