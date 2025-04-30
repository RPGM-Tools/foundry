import type { RpgmVault } from "@/vault";

declare global {
	interface RPGM {
		vault?: RpgmVault
	}

	interface RadialMenuCategories {
		"rpgm_vault"
	}
}

export { };
