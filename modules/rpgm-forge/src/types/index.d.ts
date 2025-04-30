import type { RpgmForge } from "@/forge";

declare global {
	interface RPGM {
		forge: RpgmForge
	}

	interface RadialMenuCategories {
		"rpgm_forge"
	}

	interface ForgeChatNames {
		prompt: string
		names: Names
		tokenId?: string
	}
}

declare global {
	interface RPGM {
		forge?: RpgmForge
	}
}

export { };
