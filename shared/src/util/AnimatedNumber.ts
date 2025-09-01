import { defineComponent, h, ref, type SlotsType, watch } from 'vue';

// Smooth ease-in-out curve
function variableEase(t: number, bias: number): number {
	// Clamp inputs
	t = Math.min(Math.max(t, 0), 1);
	bias = Math.min(Math.max(bias, 0), 1);

	if (bias === 0) return 1; // instant at start
	if (bias === 1) return t < 1 ? 0 : 1; // instant at end

	const sharpness = 10; // how strong the curve can get
	const mid = 0.5;
	const dist = Math.abs(bias - mid);
	const k = 1 + dist * sharpness;

	if (bias < mid) {
		// Ease-in bias: start slow
		return Math.pow(t, k);
	} else if (bias > mid) {
		// Ease-out bias: end slow
		return 1 - Math.pow(1 - t, k);
	} else {
		// Exactly 0.5 → ease-in-out
		return t < 0.5
			? 0.5 * Math.pow(2 * t, k)
			: 1 - 0.5 * Math.pow(2 * (1 - t), k);
	}
}

export default defineComponent({
	name: 'AnimatedNumber',

	props: {
		value: {
			default: 0,
			type: Number,
			required: false
		},
		duration: {
			type: Number,
			default: 1000 // ms
		},
		tag: {
			type: String as PropType<keyof HTMLElementTagNameMap>,
			default: 'span'
		}
	},

	slots: Object as SlotsType<{
		default: (scope: {
			value: number,
			display: string,
			direction: -1 | 0 | 1
		}) => undefined
	}>,

	setup(props, { slots }) {
		const displayValue = ref(props.value ?? 0);

		let animationFrame: number;
		let startTime: number | null = null;
		let startValue = props.value ?? 0;
		let endValue = props.value ?? 0;
		// -1 is decrementing, 0 is no change, 1 is incrementing
		let direction: -1 | 0 | 1 = 0;

		// Instead of restarting abruptly, we'll allow continuity:
		function animate(timestamp: number) {
			if (startTime === null) startTime = timestamp;
			const elapsed = timestamp - startTime;
			const progress = Math.min(elapsed / props.duration, 1);
			const eased = variableEase(progress, 0.95);

			displayValue.value = startValue + (endValue - startValue) * eased;

			if (progress < 1 && Math.abs(Math.round(displayValue.value) - endValue) >= 1) {
				animationFrame = requestAnimationFrame(animate);
			} else {
				startValue = endValue;
				direction = 0;
			}
		}

		// Helper: start/adjust an animation toward the latest target
		function startAnimationTo(target: number) {
			direction = target > displayValue.value ? 1 : target < displayValue.value ? -1 : 0;
			cancelAnimationFrame(animationFrame);
			// Start from current position for smoothness
			startValue = displayValue.value;
			endValue = target;
			startTime = null;
			animationFrame = requestAnimationFrame(animate);
		}

		watch(
			() => props.value,
			(newVal) => {
				newVal ??= 0;
				startAnimationTo(newVal);
			}
		);

		const formatter = new Intl.NumberFormat('en-US', { style: 'decimal' });

		return () => {
			const value = Math.round(displayValue.value);
			const display = formatter.format(value);
			const content = slots.default
				? slots.default({ value, display, direction })
				: display;

			return h(props.tag, null, content);
		};
	}
});
