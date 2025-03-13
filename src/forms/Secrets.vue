<script setup lang="ts">
import { useGame, localize } from '@/util/util'
import { ref } from 'vue';

const game = useGame()
const api_key = ref(game.settings.get("rpgm-tools", "api_key"))

const submit = () => {
	game.settings.set("rpgm-tools", "api_key", api_key.value)
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ localize("RPGM.CONFIG.SECRETS_MENU") }}</h2>
			<i>{{ localize("RPGM.CONFIG.SECRETS_MENU_SUBTITLE") }}</i>
			<div class="form-group" data-setting-id="rpgm-tools.api_key">
				<label>{{ localize("RPGM.CONFIG.API_KEY") }}</label>
				<div class="form-fields">
					<input v-model="api_key" type="password" name="rpgm-tools.api_key" data-dtype="String">
				</div>
				<p class="notes">{{ localize("RPGM.CONFIG.API_KEY_HINT") }}</p>
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

<style>
section:has(.rpgm-app) {
	filter: invert();
}

.rpgm-app {
	filter: hue-rotate(180deg);
	min-height: 400px;

	button:hover,
	button:focus {
		box-shadow: 0 0 5px #6633cc !important;
	}

	input:focus {
		box-shadow: 0 0 5px #6633cc !important;
	}

	.scrollable {
		flex-grow: 1;
	}

	footer {
		flex-grow: 0;
	}
}
</style>
