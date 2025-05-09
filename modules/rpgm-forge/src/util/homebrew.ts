import { literal } from "brigadier-ts-lite";

export function command() {
	rpgm.chat.registerCommand(literal("homebrew").executes(() => {
		void rpgm.forge!.homebrewChats.newMessage({
			schema: undefined,
			activeGeneration: "",
			generations: {}
		});
	}));
}
