import { argument, choice, literal } from "brigadier-ts-lite";

const topics: Record<string, string> = {
	"topic1": "<h3>Hello, Topic 1!</h3>",
	"topic2": "<h3>Hello, Topic 2!</h3>",
	"topic3": "<h3>Hello, Topic 3!</h3>"
};

export function registerHelpSubmenu(_options: {
	name: string,
	content: string,
}) {
}

export default function() {
	rpgm.chat.registerCommand(literal("help")
		.then(argument("topic", choice(Object.keys(topics)))
			.executes(c => {
				ChatMessage.create({
					content: topics[c.get<string>("topic")!],
					whisper: game.userId,
					speaker: { alias: "RPGM Tools" },
				});
			})).executes(() => {
				ChatMessage.create({
					content: "<h3>Hello, Topic 0!</h3>",
					whisper: game.userId,
					speaker: { alias: "RPGM Tools" },
				});
			}));
}
