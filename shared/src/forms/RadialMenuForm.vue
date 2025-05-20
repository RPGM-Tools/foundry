<script setup lang="ts">
import { RadialMenuSettings } from '#/settings/radialMenu';
import { useSetting } from '#/util';

const rpgm = globalThis.rpgm;
const radialMenuInput = useSetting("rpgm-tools.radial_menu_input");
const radialMenuHUD = useSetting("rpgm-tools.radial_menu_hud");
const app = inject<RadialMenuSettings>("app")!;

/**
 Saves changed settings
 */
function submit() {
	radialMenuInput.apply();
	radialMenuHUD.apply();
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
				<label>{{ radialMenuInput.name }}</label>
				<div class="form-fields">
					<input v-model="radialMenuInput.value" type="checkbox">
				</div>
				<p class="hint notes">
					{{ radialMenuInput.hint }} </p>
			</div>
			<div class="form-group">
				<label>{{ radialMenuHUD.name }}</label>
				<div class="form-fields">
					<input v-model="radialMenuHUD.value" type="checkbox">
				</div>
				<p class="hint notes">
					{{ radialMenuHUD.hint }}
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
