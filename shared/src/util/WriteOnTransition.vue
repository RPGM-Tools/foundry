<script setup lang="ts">

const { duration } = defineProps<{
	duration: number
}>();

let interval: number | null = null;
let fromText = "";
let toText = "";

/**
 * @param el - Event Element
 */
function onBeforeLeave(el: Element) {
	fromText = (el as HTMLElement).innerText;
}

/**
 * @param el - Event Element
 */
function onBeforeEnter(el: Element) {
	toText = (el as HTMLElement).innerText;
	(el as HTMLElement).innerText = fromText;
}

/**
 * Extracts the common prefix of two strings
 * @param a - First string
 * @param b - Second string
 * @returns The index of the last common character
 */
function commonPrefix(a: string, b: string) {
	let i = 0;
	while (a[i] && b[i] && a[i] === b[i]) i++;
	return i;
}

/**
 * @param el - Event Element
 * @param done - Callback when transition is finished
 */
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

/**
 * Animates the writing of text on an element 
 * @param el - Element to edit
 * @param duration - How long each character should take to type
 * @param text - The text to write on
 * @param index - What position the writer should start writing
 */
async function writeOn(el: HTMLElement, duration: number, text: string, index: number = 1): Promise<void> {
	await new Promise<void>(resolve => {
		if (interval)
			clearInterval(interval);
		let i = index;
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

/**
 * Animates the deletion of text on an element 
 * @param el - Element to edit
 * @param duration - How long each character should take to delete
 * @param index - What position the writer should stop deleting
 */
async function writeOff(el: HTMLElement, duration: number, index: number = 0): Promise<void> {
	await new Promise<void>(resolve => {
		if (interval)
			clearInterval(interval);
		const text = el.innerText;
		let i = text.length;
		interval = window.setInterval(() => {
			el.innerText = text.slice(0, i--) || "⠀";
			if (i == index) {
				clearInterval(interval!);
				resolve();
			}
		}, duration);
	});
}
</script>

<template>
	<Transition :duration @before-leave="onBeforeLeave" @before-enter="onBeforeEnter" @enter="onEnter"
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
