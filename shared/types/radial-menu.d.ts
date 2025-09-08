import type { RPGMLogger } from '@rpgm/tools';

declare global {
	// List of valid category strings, to be merged by modules
	interface RadialMenuCategories {
		'rpgm_debug': unknown
	}

	type RadialMenuCategoryOptions = {
		color: string
		logger: RPGMLogger
	};

	interface RadialButton<T = ButtonContext> {
		category: RadialMenuCategoryOptions
		icon: string
		tooltip: RpgmLangs
		logger: RPGMLogger
		detective?: (context: T) => boolean
		callback: (context: T) => Promise<void> | void
	}

	interface ButtonContext {
		loading: boolean
		shift: boolean
		element: HTMLElement | undefined
	}

	interface InputContext extends ButtonContext {
		getValue(): string
		setValue(value: string): void
	}

	interface TokenHudContext extends ButtonContext {
		token: Token | undefined
	}
}
export { };
