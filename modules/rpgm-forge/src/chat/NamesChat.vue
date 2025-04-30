<script setup lang="ts">
import { ForgeNames } from '@rpgm/forge';
import { getSelectedToken } from '@/util/token';

const message = inject<ChatMessage>("message")!;
const data = reactive(rpgm.forge!.getName(message.id!)!);
const localize = rpgm.localize;

async function generate(regenerate: boolean = false) {
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
			rpgm.chat.updateScroll(chatlog);
			if (i === result.output.length - 1)
				rpgm.forge!.setName(message.id!, toRaw(data));
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
	<TransitionGroup name="gak" class="rpgm-forge-name-container" tag="ul">
		<li @click="assign(name)" :title="localize('RPGM_FORGE.NAMES.ASSIGN_TOOLTIP')" class="rpgm-forge-name"
			v-for="name in data.names" :key="name">
			‣ {{ name }}
		</li>
	</TransitionGroup>
	<button @click="generate(true)">Regenerate</button>
</template>

<style>
.rpgm-forge-name-container {
	position: relative;
	margin: 0;
	padding-left: 0;
	padding-bottom: 4px;
}

.rpgm-forge-name {
	list-style: none;
	position: relative;
	left: 0;
	transition: left 150ms ease-in-out !important;
}

.rpgm-forge-name:hover {
	left: 4px;
}

.gak-enter-active {
	transition-delay: 750ms !important;
}

.gak-enter-active,
.gak-leave-active {
	transition-property: all !important;
	transition-duration: 750ms !important;
	transition-timing-function: ease !important;
}

.gak-enter-from,
.gak-leave-to {
	opacity: 0;
	max-height: 0;
	left: -10px;
}

.gak-enter-to,
.gak-leave-from {
	opacity: 1;
	max-height: 100px;
	left: 0px;
}
</style>
