import { watchDebounced } from "@vueuse/core";

export class ChatDatabase<T extends object> {
	data!: Map<string, T>;
	get placeholder() { return `<div class="${this.moduleId}-${this.key}">If you are seeing this, please install ${this.moduleId}</div>`; }

	constructor(
		readonly moduleId: string,
		readonly key: string,
		readonly renderer: Component,
		readonly title: string
	) { }

	async newMessage(data: T) {
		// Set render to false to try and delay the first message render by the time we set the data
		const message = await ChatMessage.create({
			speaker: { alias: this.title },
			whisper: game.userId,
			content: this.placeholder,
		}, { broadcast: false, render: false, renderSheet: false });
		this.data.set(message!.id!, data);
		this.save();
	}

	query(message: ChatMessage): boolean {
		return this.data.has(message.id ?? "");
	}

	render(message: ChatMessage, html: JQuery<HTMLElement>) {
		const mount = html.find(`.${this.moduleId}-${this.key}`).get(0)!;
		const app = createApp(this.renderer);
		app.provide("message", message);
		app.provide("data", reactive(this.data.get(message.id!)!));
		app.mount(mount);
	}

	/** Reduce data to only those in chat */
	prune() {
		this.data = Array.from(this.data).reduce((obj, [key, value]) => {
			if (ui.chat.collection.has(key)) obj.set(key, value);
			return obj;
		}, new Map<string, T>());
		this.save();
	}

	load() {
		const dataString = localStorage.getItem(`${this.moduleId}.${this.key}`);
		if (!dataString) return void (this.data = new Map());
		this.data = new Map(Object.entries(JSON.parse(dataString) as { [key: string]: T }));
		rpgm.chat.registerMessageHandler(this);
	}

	private save() {
		localStorage.setItem(`${this.moduleId}.${this.key}`, JSON.stringify(Object.fromEntries(this.data)));
	}

	useChatDatabase() {
		const message = inject<T>("message") as ChatMessage;
		const data = inject<T>("data") as T;
		const rData = reactive(data);
		watchDebounced(rData, () => this.save(), { debounce: 1000 });
		return { data: rData, message };
	}
}
