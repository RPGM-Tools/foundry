<script setup lang="ts">
import { useSetting } from '#/util';
import { SecretsSettings } from '#/settings/secrets';

const api_key = useSetting("rpgm-tools.api_key");
const app = inject<SecretsSettings>("app")!;

/**
 Saves changed settings
 */
function submit() {
	api_key.save();
	void app.close();
};
</script>

<template>
	<form class="rpgm-app-inner standard-form flexcol" @submit.prevent="submit">
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
