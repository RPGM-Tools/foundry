import { watchDebounced } from "@vueuse/core";
import type { App, Component } from "vue";

/**
 *
 */
export class ChatWizard<T extends object> {
	data: Map<string, T> = new Map();
	apps: Map<string, App> = new Map();
	/** @returns Placeholder content for when a module isn't installed */
	get placeholder() { return `<div class="${this.moduleId}-${this.key}">If you are seeing this, please install ${this.moduleId}</div>`; }
	readonly key: ClientSettings.KeyFor<typeof this.moduleId>;

	constructor(
		readonly moduleId: ClientSettings.Namespace,
		key: string,
		readonly renderer: Component,
		readonly title: string,
	) {
		this.key = key as unknown as ClientSettings.KeyFor<typeof moduleId>;
	}

	/**
	 * Creates a message and saves it to the database
	 * @param data - The data to store to this message
	 */
	async newMessage(data: T) {
		rpgm.logger.log(data);
		// Set render to false to try and delay the first message render by the time we set the data
		const id = foundry.utils.randomID();
		this.data.set(id, data);
		await ChatMessage.create({
			speaker: { alias: this.title },
			whisper: game.userId,
			content: this.placeholder,
			//@ts-expect-error Types broken for flags
			flags: { [this.moduleId]: { [this.key]: id } }
		}, { broadcast: false });
		ui.chat.activate();
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
		return Boolean(this.messageId(message));
	}

	/**
	 * Renders a message by mounting a vue app to its content
	 * @param message - The message being rendered
	 * @param html - The html of the message
	 * @returns Whether or not the message was rendered
	 */
	render(message: ChatMessage, html: HTMLElement): boolean {
		const id = this.messageId(message);
		const data = this.data.get(id);

		if (!data) {
			rpgm.logger.warn(`No data found for ${this.key} wizard with id ${id}, deleting...`);
			//@ts-expect-error Types broken
			message.delete({});
			return false;
		}

		const app = createApp(this.renderer);
		const mount = html.querySelector<HTMLElement>(`.${this.moduleId}-${this.key}`)!;
		app.provide("message", message);
		app.provide("id", id);
		app.provide("data", reactive(data));
		app.provide("element", html);
		app.mount(mount);

		// Inject delete handler to remove this data from localStorage
		const del = message["delete"].bind(message);
		const delData = this.delete.bind(this);
		message["delete"] = (function(operation: never) {
			delData(message);
			return del(operation);
		}).bind(message);
		return true;
	}

	/**
	 * @param message - The message to delete
	 */
	delete(message: ChatMessage) {
		this.data.delete(this.messageId(message));
		this.save();
	}

	/**
	 * Retrieves all data for this database, creating it if it doesn't exist
	 */
	load() {
		game.settings.register(this.moduleId, this.key, {
			scope: "world",
		});
		const data = game.settings.get(this.moduleId, this.key) as string;
		this.data = data ? new Map(Object.entries(JSON.parse(data) as typeof this.data)) : new Map();
		rpgm.chat.registerMessageHandler(this);
	}

	/** Sync this database's data to localStorage */
	private save() {
		game.settings.set(this.moduleId, this.key, JSON.stringify(Object.fromEntries(this.data)));
		// localStorage.setItem(`${this.moduleId}.${this.key}`, JSON.stringify(Object.fromEntries(this.data)));
	}

	/**
	 * A vue composable for grabbing a reactive reference to a message's data
	 * @param debounce - How often to save data when it gets changed
	 * @returns A reactive reference to the message's data, along with the original message
	 */
	useChatWizard(debounce: number = 1000) {
		const message = inject<T>("message") as ChatMessage;
		const data = inject<T>("data") as T;
		const id = inject<string>("id") as string;
		const element = inject<HTMLElement>("element") as HTMLElement;
		const rData = reactive(data);
		const saved = ref(true);
		watch(rData, () => { saved.value = false; });
		watchDebounced(rData, () => { this.save(); saved.value = true; }, { debounce });
		return { data: rData, message, id, element, saved };
	}
}
