import type { Homebrew, HomebrewOptions } from '@rpgm/tools/forge';

import type { RpgmForge } from '$/forge';

type Optional<T, K extends keyof T> = { [K in keyof T]: T[K] | undefined } & Omit<T, K>;

declare global {
	interface RPGM {
		forge: RpgmForge
	}

	interface FlagConfig {
		JournalEntry: {
			'rpgm-forge': unknown
		}
		JournalEntryPage: {
			'rpgm-forge': unknown
		}
	}

	interface RadialMenuCategories {
		'rpgm_forge': unknown
	}

	type ForgeChatNames = {
		prompt: string
		names: string[]
		tokenId?: string
	};

	type ForgeChatDescription = {
		type: string
		name?: string
		description: Description
		tokenId?: string
	};

	type ForgeChatHomebrew = {
		options: Optional<HomebrewOptions, 'schema'>
		activeGeneration: string
		generations: Record<string, Homebrew>
	};
}

export { };
