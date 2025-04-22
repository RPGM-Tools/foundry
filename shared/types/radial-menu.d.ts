declare global {
	// List of valid category strings, to be merged by modules
	interface RadialMenuCategories { }

	type RadialMenuCategoryOptions = {
		color: string
	}

	interface RadialButton<T = ButtonContext> {
		category: RadialMenuCategoryOptions
		icon: string
		tooltip: string
		detective: (context: T) => boolean
		callback: (context: T) => Promise<void>
	}

	interface ButtonContext {
		loading: boolean
		element: HTMLElement
	}

	interface InputContext extends ButtonContext {
		getValue(): string
		setValue(value: string): void
	}

	interface TokenHudContext extends ButtonContext {
		token: Token | undefined
	}
}
export { }
