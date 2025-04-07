export async function writeOn(context: InputContext, text: string, time: number): Promise<void> {
	return new Promise(resolve => {
		let i = 1
		const interval = setInterval(() => {
			context.setValue(text.slice(0, i++))
			if (i > text.length) {
				clearInterval(interval)
				resolve()
			}
		}, time / text.length)
	})
}
