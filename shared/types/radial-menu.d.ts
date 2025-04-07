import { type Ref } from "vue"

declare global {
	type RadialMenuCategoryOptions = {
		color: string
	}
}

declare global {
	interface RadialButton<T extends ButtonContext> {
		category: string
		icon: string
		tooltip: string
		detective: (context: T) => boolean
		callback: (context: T) => Promise<void>
	}

	interface ButtonContext {
		loading: boolean
	}

	interface InputContext extends ButtonContext {
		element: HTMLElement
		getValue(): string
		setValue(value: string): void
	}

	interface TokenHudContext extends ButtonContext {
		token: Token
	}
}
export { }
