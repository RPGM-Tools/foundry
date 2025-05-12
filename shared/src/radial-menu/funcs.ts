/**
 * Animate text on a rp-button's input field
 * @param context - Context of this rp-button
 * @param text - The text to animate
 * @param time - How long the animation should take
 */
export async function writeOn(context: InputContext, text: string, time: number): Promise<void> {
	return new Promise(resolve => {
		let i = 1;
		const interval = setInterval(() => {
			context.setValue(text.slice(0, i++));
			if (i > text.length) {
				clearInterval(interval);
				resolve();
			}
		}, time / text.length);
	});
}

/**
 * Applys a shimmer effect to the rp-button's input
 * @param context - Context of this rp-button
 * @returns A function to clear the effect
 */
export function shimmerInput(context: InputContext) {
	context.element.classList.add("rpgm-active");
	return () => { context.element.classList.remove("rpgm-active"); };
}
