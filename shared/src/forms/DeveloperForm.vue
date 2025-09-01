<script setup lang="ts">
import { DeveloperSettings } from '#/settings/developer';
import { useSetting } from '#/util';

const radialMenuDebug = useSetting('rpgm-tools.radial_menu_debug');
const app = inject<DeveloperSettings>('app')!;

/**
 * Saves changed settings
 */
function submit() {
	radialMenuDebug.save();
	void app.close();
};
</script>

<template>
	<form class="rpgm-app-inner standard-form flexcol" @submit.prevent="submit">
		<div class="scrollable tab">
			<h2>{{ DeveloperSettings.name }}</h2>
			<i>{{ DeveloperSettings.subtitle }}</i>
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
