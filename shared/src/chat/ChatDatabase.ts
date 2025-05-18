import { watchDebounced } from "@vueuse/core";
import type { App, Component } from "vue";

/**
 * A record of unique ids to data for use in chat Wizards
 */
export class ChatDatabase<T extends object> {
	data!: Map<string, T>;
	apps: Map<string, App> = new Map();
	/** @returns Placeholder content for when a module isn't installed */
	get placeholder() { return `<div class="${this.moduleId}-${this.key}">If you are seeing this, please install ${this.moduleId}</div>`; }

	constructor(
		readonly moduleId: string,
		readonly key: string,
		readonly renderer: Component,
		readonly title: string,
	) { }

	/**
	 * Creates a message and saves it to the database
	 * @param data - The data to store to this message
	 */
	async newMessage(data: T) {
		// Set render to false to try and delay the first message render by the time we set the data
		const id = foundry.utils.randomID();
		rpgm.logger.debug(Object.fromEntries(this.data));
		this.data.set(id, data);
		rpgm.logger.debug(Object.fromEntries(this.data));
		await ChatMessage.create({
			speaker: { alias: this.title },
			whisper: game.userId,
			content: this.placeholder,
			//@ts-expect-error Types broken for flags
			flags: { [this.moduleId]: { [this.key]: id } }
		}, { broadcast: false });
		this.save();
		rpgm.chat.updateScroll(true);
	}

	/**
	 * Extracts the unique key from the flags of a message
	 * @param message - The message to retrieve the id of
	 * @returns A unique identifier extracted for this message if it exists
	 */
	private messageId(message: ChatMessage): string {
		//@ts-expect-error Types broken for flags
		return message.getFlag(this.moduleId, this.key);
	}

	/**
	 * Decides whether or not to handle rendering for a given message
	 * @param message - The message to query
	 * @returns Whether or not this message should be rendered with this database
	 */
	query(message: ChatMessage): boolean {
		rpgm.logger.log(Object.fromEntries(this.data));
		return this.data.has(this.messageId(message) ?? "");
	}

	/**
	 * Renders a message by mounting a vue app to its content
	 * @param message - The message being rendered
	 * @param html - The html of the message
	 */
	render(message: ChatMessage, html: HTMLElement) {
		rpgm.logger.debug("rendering", message);
		const id = this.messageId(message);
		const app = createApp(this.renderer);
		const mount = html.querySelector<HTMLElement>(`.${this.moduleId}-${this.key}`)!;
		app.provide("message", message);
		app.provide("id", id);
		app.provide("data", reactive(this.data.get(id)!));
		app.mount(mount);

		// Inject delete handler to remove this data from localStorage
		const del = message["delete"].bind(message);
		const delData = this.delete.bind(this);
		message["delete"] = (function(operation: never) {
			delData(message);
			return del(operation);
		}).bind(message);
	}

	/**
	 * @param message - The message to delete
	 */
	delete(message: ChatMessage) {
		this.data.delete(this.messageId(message));
		this.save();
	}

	/** Retrieves all data for this database */
	load() {
		const dataString = localStorage.getItem(`${this.moduleId}.${this.key}`);
		if (!dataString) { this.data = new Map(); }
		else {
			this.data = new Map(Object.entries(JSON.parse(dataString) as { [key: string]: T }));
		}
		rpgm.chat.registerMessageHandler(this);
	}

	/** Sync this database's data to localStorage */
	private save() {
		localStorage.setItem(`${this.moduleId}.${this.key}`, JSON.stringify(Object.fromEntries(this.data)));
	}

	/**
	 * A vue composable for grabbing a reactive reference to a message's data
	 * @param debounce - How often to save data when it gets changed
	 * @returns A reactive reference to the message's data, along with the original message
	 */
	useChatDatabase(debounce: number = 1000) {
		const message = inject<T>("message") as ChatMessage;
		const data = inject<T>("data") as T;
		const id = inject<string>("id") as string;
		const rData = reactive(data);
		watchDebounced(rData, () => this.save(), { debounce });
		return { data: rData, message, id };
	}
}
