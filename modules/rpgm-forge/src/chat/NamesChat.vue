<script setup lang="ts">
import { ForgeNames } from '@rpgm/forge';
import { getSelectedToken } from '@/util/token';

const message = inject<ChatMessage>("message")!;
const data = reactive(rpgm.forge!.getName(message.id!)!);
const localize = rpgm.localize;
const loading = ref(false);

async function generate(regenerate: boolean = false) {
	loading.value = true;
	if (regenerate)
		for (let i = 0; i < data.names.length; i++)
			setTimeout(() => {
				data.names.pop();
			}, 100 * i);

	const options: NamesOptions = {
		quantity: 4,
		gender: "random",
		genre: "Fantasy",
		method: "ai",
		type: data.prompt
	};

	const result = await ForgeNames.fromOptions(options).generate({
		auth_token: game.settings.get("rpgm-tools", "api_key")
	});

	if (!result.success) return;
	const chatlog = document.querySelector("#chat #chat-log") as HTMLElement;

	result.output.forEach((v, i) => {
		setTimeout(() => {
			data.names.push(v);
			rpgm.chat.updateScroll(chatlog, !regenerate);
			if (i === result.output.length - 1) {
				rpgm.forge!.setName(message.id!, toRaw(data));
				loading.value = false;
			}
		}, i * 100);
	});
}

function assign(name: string) {
	const token = getSelectedToken();
	if (!token) return;
	const oldName = token.name;
	//@ts-expect-error Unsafe updating of tokenDocument
	void token.document.update({ name }, {});
	rpgm.forge!.logger.logU(`Renamed ${oldName} to ${name}`);
}

onMounted(() => {
	if (!data.names.length) void generate();
});
</script>

<template>
	<h3>{{ data.prompt }}</h3>
	<TransitionGroup name="rpgm-forge-name" class="rpgm-forge-name-container" tag="ul">
		<li @click="assign(name)" :title="localize('RPGM_FORGE.NAMES.ASSIGN_TOOLTIP')" class="rpgm-forge-name"
			v-for="name in data.names" :key="name">
			{{ name }}
		</li>
	</TransitionGroup>
	<button :disabled="loading" class="rpgm-button" @click="generate(true)">Regenerate</button>
</template>

<style>
.rpgm-forge-name-container {
	position: relative;
	padding-left: 4px;
	margin: 0 !important;
}

.rpgm-forge-name::marker {
	content: "‣ ";
}

.rpgm-forge-name {
	position: relative;
	left: 0;
	transition: transform 150ms ease-in-out !important;
}

.rpgm-forge-name:hover {
	transform: translateX(4px);
}

.rpgm-forge-name-enter-active {
	transition-delay: 750ms !important;
}

.rpgm-forge-name-enter-active,
.rpgm-forge-name-leave-active {
	transition-property: all !important;
	transition-duration: 750ms !important;
	transition-timing-function: ease !important;
}

.rpgm-forge-name-enter-from,
.rpgm-forge-name-leave-to {
	opacity: 0;
	max-height: 0;
	left: -10px;
}

.rpgm-forge-name-enter-to,
.rpgm-forge-name-leave-from {
	opacity: 1;
	max-height: 100px;
	left: 0px;
}
</style>
