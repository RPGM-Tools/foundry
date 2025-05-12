import { literal } from "brigadier-ts-lite";

/**
 * Register the homebrew rp-command
 */
export function command() {
	rpgm.chat.registerCommand(literal("homebrew").executes(() => {
		void rpgm.forge!.homebrewChats.newMessage({
			schema: undefined,
			activeGeneration: "",
			generations: {}
		});
	}));
}
