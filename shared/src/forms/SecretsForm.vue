<script setup lang="ts">
import { useGame, localize } from '#/util/util'
import { ref } from 'vue';

const game = useGame()
const api_key = ref(game.settings.get("rpgm-tools", "api_key"))

const submit = () => {
	game.settings.set("rpgm-tools", "api_key", api_key.value)
}

const yes = ref(false)

const toggle = async () => {
	// await new Promise(resolve => setTimeout(resolve, 1000))
	yes.value = !yes.value
	const textareas = document.getElementsByTagName("textarea")
	for (let i = 0; i < textareas.length; i++) {
		apply(textareas[i])
	}
	const inputs = document.getElementsByTagName("input")
	for (let i = 0; i < inputs.length; i++) {
		apply(inputs[i])
	}
	const editable = document.querySelectorAll('[contenteditable="true"]')
	for (let i = 0; i < editable.length; i++) {
		apply(editable[i] as HTMLElement)
	}
}

const apply = (html: HTMLElement) => {
	const time = 500
	if (yes.value) {
		html.style.transition = `background ${time}ms ease, box-shadow ${time}ms ease`
		html.classList.add("rpgm-active")
	}
	else {
		html.classList.remove("rpgm-active")
		setTimeout(() => { html.style.transition = "" }, time)
	}
}
</script>

<template>
	<form @submit.prevent="submit" class="rpgm-app flexcol">
		<div class="scrollable">
			<h2>{{ localize("RPGM.CONFIG.SECRETS_SETTINGS") }}</h2>
			<i>{{ localize("RPGM.CONFIG.SECRETS_SETTINGS_SUBTITLE") }}</i>
			<div class="form-group" data-setting-id="rpgm-tools.api_key">
				<label>{{ localize("RPGM.CONFIG.API_KEY") }}</label>
				<div class="form-fields">
					<input v-model="api_key" type="password" name="rpgm-tools.api_key" data-dtype="String">
				</div>
				<p class="notes">{{ localize("RPGM.CONFIG.API_KEY_HINT") }}</p>
			</div>
			<textarea></textarea>
			<button @click.prevent="toggle">Toggle</button>
		</div>
		<footer>
			<button type="submit">
				<i class="fas fa-save"></i>
				Save Changes
			</button>
		</footer>
	</form>
</template>
