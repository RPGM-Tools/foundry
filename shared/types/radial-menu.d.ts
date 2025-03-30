declare global {
	type MenuButton = {
		category: string
		icon: string
		tooltip: string
		detective: (context: MenuContext) => boolean
		callback: (context: MenuContext) => void
	}

	type RadialMenuCategoryOptions = {
		color: string
	}

	type MenuContext = {
		element: HTMLElement
	}
}
export { }
