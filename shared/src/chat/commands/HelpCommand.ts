import { argument, choice, literal } from "brigadier-ts-lite";

const topics: Record<string, string> = {
	"names": `
<div class="rpgm-help">
	<h2>Help - Names</h2>
	<p>Names can be generated for the selected token by running <code>*names</code>.<p>
	<p>Alternatively, names can be generated for a specific type by running <code>*names &lt;type&gt</code>.</p>
	<p>Names can be generated offline by setting Method to "Simple" in the module settings.</p>
</div>
`.trim(),
	"description": `
<div class="rpgm-help">
	<h2>Help - Description</h2>
	<p>Descriptions can be generated for the selected token by running <code>*description</code>.</p>
	<p>Alternatively, descriptions can be generated for a specific type by running <code>*description &lt;type&gt</code>.</p>
</div>
`.trim(),
	"homebrew": `
<div class="rpgm-help">
	<h2>Help - Homebrew</h2>
	<p>
		Homebrew can be generated for the selected token by running <code>*homebrew &lt;type&gt</code>.
		<br>
		If no type is provided, one will be selected randomly.
	</p>
	<p>
		Homebrew is generated via a list of fields. While on the edit page, you can add, remove, and reorder fields.
		You can edit a field's name and description, as well as what type it represents.
	</p>
	<p>
		After generating, you will see the homebrew in the viewer.
		You can copy an individual field, or the entire homebrew in markdown format.
		You can send the generation to journal for viewing later.
	</p>
</div>
`.trim(),
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
				void ChatMessage.create({
					content: topics[c.get<string>("topic")!],
					whisper: game.userId,
					speaker: { alias: "RPGM Tools" },
				});
			})).executes(() => {
				void ChatMessage.create({
					content: `
<div class="rpgm-help">
	<h2>Help - Commands</h2>
	<p>Run <code>*help &lt;topic&gt</code> to get help on a specific topic.</p>
	<ul>
		<li>names - generate names for tokens</li>
		<li>description - generate descriptions for tokens</li>
		<li>homebrew - generate anything</li>
	</ul>
</div>
`.trim(),
					whisper: game.userId,
					speaker: { alias: "RPGM Tools" },
				});
			}));
}
