import { argument, choice, literal } from "brigadier-ts-lite";

const topics: Array<[string, string]> = [
	["topic1", "<h3>Hello, Topic 1!</h3>"],
	["topic2", "<h3>Hello, Topic 2!</h3>"],
	["topic3", "<h3>Hello, Topic 3!</h3>"]
];

export function registerHelpSubmenu(_options: {
	name: string,
	content: string,
}) {
}

export default function() {
	rpgm.chat.registerCommand(literal("help")
		.then(argument("topic", choice(topics.map(t => t[0])))
			.executes(c => {
				ChatMessage.create({
					content: topics.find(v => v[0] === c.get("topic")!)![1],
					whisper: game.userId,
					speaker: { alias: "RPGM Tools" },
				});
			})));
}
