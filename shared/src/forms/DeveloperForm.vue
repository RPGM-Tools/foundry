<script setup lang="ts">
import { DeveloperSettings } from '#/settings/developer';
import { useSetting } from '#/util';

const verboseLogs = useSetting("rpgm-tools.verbose-logs");
const radialMenuDebug = useSetting("rpgm-tools.radial_menu_debug");
const app = inject<DeveloperSettings>("app")!;

const submit = () => {
	verboseLogs.apply();
	radialMenuDebug.apply();
	void app.close();
};
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app-inner standard-form flexcol">
		<div class="scrollable tab">
			<h2>{{ DeveloperSettings.name }}</h2>
			<i>{{ DeveloperSettings.subtitle }}</i>
			<div class="form-group">
				<label>{{ verboseLogs.name }}</label>
				<div class="form-fields">
					<input v-model="verboseLogs.value" type="checkbox">
				</div>
				<p class="hint notes">
					{{ verboseLogs.hint }}
				</p>
			</div>
			<div class="form-group">
				<label>{{ radialMenuDebug.name }}</label>
				<div class="form-fields">
					<input v-model="radialMenuDebug.value" type="checkbox">
				</div>
				<p class="hint notes">
					{{ radialMenuDebug.hint }}
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
