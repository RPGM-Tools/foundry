import { argument, literal, string } from "brigadier-ts-lite";

/**
 * Register the homebrew rp-command
 */
export function command() {
	rpgm.chat.registerCommand(literal("homebrew")
		.then(argument("type", string("greedy_phrase"))
			.executes(c => {
				void rpgm.forge.homebrewChats.newMessage(getSchema(c.get("type")));
			}))
		.executes(() => {
			void rpgm.forge.homebrewChats.newMessage(getSchema());
		}));
}

/** 
 * Finds a preset from a name, or an empty schema
 * @param name - The name to grab a preset from
 * @returns The schema
 */
function getSchema(name?: string): ForgeChatHomebrew {
	return {
		options: {
			genre: rpgm.forge.genre,
			system: rpgm.forge.system,
			language: rpgm.forge.language,
			schema: name ? structuredClone(rpgm.forge.homebrewSchemas.find((v) => {
				return v.name.toLowerCase().trim() === name?.toLowerCase().trim();
			})) ?? {
				name,
				custom_name: undefined,
				fields: []
			} : undefined
		},
		activeGeneration: "",
		generations: {}
	};
}
