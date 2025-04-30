<script setup lang="ts">
import { useSetting } from '#/util';
import { SecretsSettings } from '#/settings/secrets';

const game = globalThis.game;
const api_key = useSetting("rpgm-tools", "api_key");
const app = inject<SecretsSettings>("app")!;

const submit = () => {
	void game.settings.set("rpgm-tools", "api_key", api_key.value);
	void app.close();
};
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app-inner standard-form flexcol">
		<div class="scrollable tab">
			<h2>{{ SecretsSettings.name }}</h2>
			<i>{{ SecretsSettings.subtitle }}</i>
			<div class="form-group">
				<label>{{ api_key.name }}</label>
				<div class="form-fields">
					<input v-model="api_key.value" placeholder="↑ ↑ ↓ ↓ ← → ← → B A ⏎" type="password" name="rpgm-tools.api_key"
						data-dtype="String">
				</div>
				<p class="hint notes">
					{{ api_key.hint }}
				</p>
			</div>
		</div>
		<footer class="form-footer">
			<button @click.prevent="submit">
				<i class="fas fa-save" />
				Save Changes
			</button>
		</footer>
	</form>
</template>
