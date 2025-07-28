import type { RpgmForge } from "@/forge";

type Optional<T, K extends keyof T> = { [K in keyof T]: T[K] | undefined } & Omit<T, K>;

declare global {
	interface RPGM {
		forge: RpgmForge
	}

	interface FlagConfig {
		JournalEntry: {
			"rpgm-forge"
		}
		JournalEntryPage: {
			"rpgm-forge"
		}
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
		options: Optional<HomebrewOptions, "schema">
		activeGeneration: string
		generations: Record<string, Homebrew>
	}
}

export { };
