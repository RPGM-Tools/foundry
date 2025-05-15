import type { RpgmForge } from "@/forge";

declare global {
	interface RPGM {
		forge: RpgmForge
	}

	interface RadialMenuCategories {
		"rpgm_forge"
	}

	type ForgeChatNames = {
		prompt: string
		names: Names
		tokenId?: string
	}

	type ForgeChatDescription = {
		type: string
		name?: string
		description: Description
		tokenId?: string
	}

	type ForgeChatHomebrew = {
		schema: HomebrewOptions | undefined
		activeGeneration: string
		generations: Record<string, Homebrew>
	}
}

export { };
