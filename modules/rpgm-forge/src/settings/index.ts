import { GlobalMenus } from "#/settings";

export function RegisterSettings() {
	GlobalMenus("rpgm-forge");
	game.settings.register("rpgm-forge", "names", { default: {}, });
}
