<script setup lang="ts">
import { RadialMenuSettings } from '#/settings/radialMenu';
import { useSetting } from '#/util';

const rpgm = globalThis.rpgm;
const radialMenuEnabled = useSetting("rpgm-tools.radial_menu_enabled");
const app = inject<RadialMenuSettings>("app")!;

/**
 Saves changed settings
 */
function submit() {
	radialMenuEnabled.apply();
	rpgm.radialMenu.update();
	void app.close();
};
</script>

<template>
	<form class="rpgm-app-inner standard-form flexcol" @submit.prevent="submit">
		<div class="scrollable tab">
			<h2>{{ RadialMenuSettings.name }}</h2>
			<i>{{ RadialMenuSettings.subtitle }}</i>
			<div class="form-group">
				<label>{{ radialMenuEnabled.name }}</label>
				<div class="form-fields">
					<input v-model="radialMenuEnabled.value" type="checkbox">
				</div>
				<p class="hint notes">
					{{ radialMenuEnabled.hint }}
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
