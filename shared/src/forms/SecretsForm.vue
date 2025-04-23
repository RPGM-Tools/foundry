<script setup lang="ts">
import { useSetting } from '#/util';

const rpgm = globalThis.rpgm
const game = globalThis.game
const api_key = useSetting("rpgm-tools", "api_key")

const submit = () => {
	game.settings.set("rpgm-tools", "api_key", api_key.value)
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ rpgm.localize("RPGM.CONFIG.SECRETS_SETTINGS") }}</h2>
			<i>{{ rpgm.localize("RPGM.CONFIG.SECRETS_SETTINGS_SUBTITLE") }}</i>
			<div class="form-group">
				<label>{{ api_key.name }}</label>
				<div class="form-fields">
					<input v-model="api_key.value" placeholder="↑ ↑ ↓ ↓ ← → ← → B A ⏎" type="password" name="rpgm-tools.api_key"
						data-dtype="String">
				</div>
				<p class="notes">{{ api_key.hint }}</p>
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
