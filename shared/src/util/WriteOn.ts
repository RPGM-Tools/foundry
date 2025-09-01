import { type SlotsType, Text } from 'vue';

/**
 * Extracts the common prefix of two strings.
 * @param a - First string
 * @param b - Second string
 * @returns The index of the last common character
 */
function commonPrefix(a: string, b: string) {
	let i = 0;
	while (a[i] && b[i] && a[i] === b[i]) i++;
	return i;
}

export default defineComponent({
	name: 'WriteOn',

	props: {
		value: {
			type: String,
			required: true
		},
		duration: {
			type: Number,
			required: true
		},
		enabled: {
			type: Boolean,
			default: true
		},
		appear: {
			type: Boolean,
			default: false
		},
		tag: {
			type: String as PropType<keyof HTMLElementTagNameMap>,
			default: 'h1'
		}
	},

	slots: Object as SlotsType<{
		default: (display: Ref<string>) => VNode[]
	}>,

	setup(props, { slots, attrs }) {
		const displayText = ref('');
		let interval: number | null = null;
		let fromText = '';
		let toText = '';
		const animating = ref(false);

		async function onEnter() {
			if (!props.enabled) { return; }
			const prefix = commonPrefix(fromText, toText);
			const timePerChar = props.duration / ((toText.length - prefix + 1) + (fromText.length - prefix + 1));
			animating.value = true;
			writeOff(timePerChar, prefix - 1).then(() => {
				writeOn(timePerChar, toText, prefix).then(() =>
					animating.value = false
				);
			});
		}

		/**
		 * Animates the writing of text on an element.
		 * @param el - Element to edit
		 * @param duration - How long each character should take to type
		 * @param text - The text to write on
		 * @param index - What position the writer should start writing
		 */
		async function writeOn(duration: number, text: string, index: number = 1): Promise<void> {
			await new Promise<void>(resolve => {
				if (interval)
					clearInterval(interval);
				let i = index;
				interval = window.setInterval(() => {
					if (i === text.length + 1) {
						displayText.value = text || '​';
						clearInterval(interval!);
						resolve();
						return;
					}
					displayText.value = '​' + text.slice(0, i++) + '▮';
				}, duration);
			});
		}

		/**
		 * Animates the deletion of text on an element.
		 * @param el - Element to edit
		 * @param duration - How long each character should take to delete
		 * @param index - What position the writer should stop deleting
		 */
		async function writeOff(duration: number, index: number = 0): Promise<void> {
			await new Promise<void>(resolve => {
				if (interval)
					clearInterval(interval);
				const text = fromText;
				let i = text.length;
				interval = window.setInterval(() => {
					displayText.value = '​' + text.slice(0, i--) + '▮';
					if (i == index) {
						clearInterval(interval!);
						resolve();
					}
				}, duration);
			});
		}

		watch(() => props.value, (v) => {
			if (v === toText) return;
			if (interval)
				clearInterval(interval);
			fromText = displayText.value;
			toText = v;
			onEnter();
		}, { immediate: props.appear });

		onMounted(() => {
			displayText.value = props.value;
		});

		return () => {
			if (slots.default) {
				const rSlots = slots.default(displayText);

				// Rendered slot must be a single element node, otherwise wrap it
				if (rSlots.length > 1 || rSlots[0].type === Text) {
					return h(props.tag, attrs, rSlots);
				} else {
					return rSlots;
				}
			}
			return h(props.tag, attrs, displayText.value);
		};
	}
});
