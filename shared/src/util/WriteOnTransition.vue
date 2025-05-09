<script setup lang="ts">

const { duration } = defineProps<{
	duration: number
}>();

let interval: number | null = null;
let fromText = "";
let toText = "";

function onBeforeLeave(el: Element) {
	fromText = (el as HTMLElement).innerText;
}

function onBeforeEnter(el: Element) {
	toText = (el as HTMLElement).innerText;
	(el as HTMLElement).innerText = fromText;
}

function commonPrefix(a: string, b: string) {
	let i = 0;
	while (a[i] && b[i] && a[i] === b[i]) i++;
	return i;
}

function onEnter(el: Element, done: () => void) {
	const prefix = commonPrefix(fromText, toText);
	const timePerChar = duration / ((toText.length - prefix + 1) + (fromText.length - prefix + 1));
	el.classList.add("rpgm-write-on-transition");
	void writeOff(el as HTMLElement, timePerChar, prefix - 1).then(() =>
		writeOn(el as HTMLElement, timePerChar, toText, prefix)).then(() => {
			el.classList.remove("rpgm-write-on-transition");
			done();
		});
}

async function writeOn(el: HTMLElement, duration: number, text: string, index?: number): Promise<void> {
	await new Promise<void>(resolve => {
		if (interval)
			clearInterval(interval);
		let i = index ?? 1;
		interval = window.setInterval(() => {
			if (i === text.length + 1) {
				el.innerText = text || "⠀";
				clearInterval(interval!);
				resolve();
				return;
			}
			el.innerText = text.slice(0, i++) || "⠀";
		}, duration);
	});
}

async function writeOff(el: HTMLElement, duration: number, index?: number): Promise<void> {
	await new Promise<void>(resolve => {
		if (interval)
			clearInterval(interval);
		const text = el.innerText;
		let i = text.length;
		interval = window.setInterval(() => {
			el.innerText = text.slice(0, i--) || "⠀";
			if (i == (index ?? 0)) {
				clearInterval(interval!);
				resolve();
			}
		}, duration);
	});
}
</script>

<template>
	<Transition :duration @before-enter="onBeforeEnter" @before-leave="onBeforeLeave" @enter="onEnter"
		name="rpgm-write-on-transition" :css="false">
		<slot class="rpgm-write-on-transition" />
	</Transition>
</template>

<style>
.rpgm-write-on-transition::after {
	content: "▮";
	position: absolute;
}
</style>
