type HelpEntry = {
	name: string;
	url: string;
};

export class Help {
	/** Map help topics to urls. */
	pages: Map<string, HelpEntry> = new Map();
	cache: Map<string, string> = new Map();
	async fetch(url: string) { return fetch(url).then(r => r.text()); }
}
