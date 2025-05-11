import { watchDebounced } from "@vueuse/core";
import type { App, Component } from "vue";

export class ChatDatabase<T extends object> {
	data!: Map<string, T>;
	apps: Map<string, App> = new Map();
	get placeholder() { return `<div class="${this.moduleId}-${this.key}">If you are seeing this, please install ${this.moduleId}</div>`; }

	constructor(
		readonly moduleId: string,
		readonly key: string,
		readonly renderer: Component,
		readonly title: string,
	) { }

	async newMessage(data: T) {
		// Set render to false to try and delay the first message render by the time we set the data
		const id = foundry.utils.randomID();
		await ChatMessage.create({
			speaker: { alias: this.title },
			whisper: game.userId,
			content: this.placeholder,
			//@ts-expect-error Types broken for flags
			flags: { [this.moduleId]: { [this.key]: id } }
		}, { broadcast: false });
		this.data.set(id, data);
		this.save();
	}

	private messageId(message: ChatMessage): string {
		//@ts-expect-error Types broken for flags
		rpgm.logger.log(message.getFlag(this.moduleId, this.key));
		//@ts-expect-error Types broken for flags
		return message.getFlag(this.moduleId, this.key) ?? "";
	}

	query(message: ChatMessage): boolean {
		return this.data.has(this.messageId(message) ?? "");
	}

	render(message: ChatMessage, html: HTMLElement) {
		const app = createApp(this.renderer);
		const mount = html.querySelector<HTMLElement>(`.${this.moduleId}-${this.key}`)!;
		app.provide("message", message);
		app.provide("data", reactive(this.data.get(this.messageId(message))!));
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
