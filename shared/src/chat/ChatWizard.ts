import { watchDebounced } from '@vueuse/core';
import type { App, Component, Reactive } from 'vue';

export type WizardData<T extends object = object> = {
	/** The data for this message */
	data: Reactive<T>,

	/** The {@link ChatMessage} document */
	message: ChatMessage,

	/** A unique identifier for this message */
	id: string,

	/** The html element for this message */
	element: HTMLElement,

	/** Whether or not the data has been saved */
	saved: Ref<boolean>,

	/** Closes the message and deletes it */
	close: () => void
};

/**
 * ChatWizards System
 * 
 * The ChatWizards system provides a framework for creating persistent, interactive chat-based interfaces
 * within Foundry VTT. Each wizard is a specialized chat message that maintains its own state and can be
 * interacted with through custom Vue components.
 * 
 * Key Features:
 * - Persistent state management saved to world settings
 * - User-specific data isolation
 * - Automatic message creation and rendering
 * - Built-in debounced auto-saving
 * - Cleanup of orphaned messages
 * - Placeholder content for missing modules
 * 
 * Usage:
 * 1. Create a new wizard by extending ChatWizard class
 * 2. Provide a Vue component for the interface
 * 3. Register the wizard in your module's initialization
 * 4. Use the provided composable for reactive data access
 * 
 * Example:
 * ```typescript
 * const myWizard = new ChatWizard("my-module", "my-wizard", MyComponent, "My Wizard Title");
 * myWizard.load();
 * await myWizard.newMessage({ initialData: "value" });
 * ```
 */
export class ChatWizard<T extends WizardData['data'] = WizardData['data']> {
	data: Map<string, T> = new Map();
	apps: Map<string, App> = new Map();

	/** @returns Placeholder content for when a module isn't installed */
	get placeholder() { return `<div class="${this.moduleId}-${this.key}">If you are seeing this, please install ${this.moduleId}</div>`; }
	readonly _key: string;

	/** @returns The unique key for this wizard and user */
	get key(): ClientSettings.KeyFor<typeof this.moduleId> { return `${this._key}-${game.userId?.toLowerCase()}` as unknown as ClientSettings.KeyFor<typeof this.moduleId>; }

	/**
	 * Creates a new ChatWizard.
	 * @param moduleId - The namespace of this wizard, must be the module id
	 * @param key - The key of this wizard
	 * @param renderer - The component to render for this wizard
	 * @param title - The title of this wizard, to be rendered as the title of the message
	 */
	constructor(
		readonly moduleId: ClientSettings.Namespace,
		key: string,
		readonly renderer: Component,
		readonly title: string,
		readonly logger: typeof rpgm.logger
	) { this._key = key; }


	/**
	 * Creates a message and saves it to the database.
	 * @param data - The data to store to this message
	 */
	async newMessage(data?: T) {
		if (!data) data = {} as T;
		// Set render to false to try and delay the first message render by the time we set the data
		const id = foundry.utils.randomID();
		this.data.set(id, data);
		await ChatMessage.create({
			speaker: { alias: this.title },
			whisper: game.userId,
			content: this.placeholder,
			flags: { [this.moduleId]: { [this.key]: id } }
		}, { broadcast: false });
		ui.chat.activate();
		this.save();
		rpgm.chat.updateScroll(true);
	}

	/**
	 * Extracts the unique key from the flags of a message.
	 * @param message - The message to retrieve the id of
	 * @returns A unique identifier extracted for this message if it exists
	 */
	private messageId(message: ChatMessage): string {
		return message.getFlag(this.moduleId, this.key) || '';
	}

	/**
	 * Decides whether or not to handle rendering for a given message.
	 * @param message - The message to query
	 * @returns Whether or not this message should be rendered with this database
	 */
	query(message: ChatMessage): boolean {
		return Boolean(this.messageId(message));
	}

	/**
	 * Renders a message by mounting a vue app to its content.
	 * @param message - The message being rendered
	 * @param html - The html of the message
	 * @returns Whether or not the message was rendered
	 */
	render(message: ChatMessage, html: HTMLElement): boolean {
		const id = this.messageId(message);
		const data = this.data.get(id);

		if (!data) {
			this.logger.warn(`No data found for ${this.key} wizard with id ${id}, deleting...`);
			void message.delete({});
			return false;
		}

		const app = createApp(this.renderer);
		const mount = html.querySelector<HTMLElement>(`.${this.moduleId}-${this.key}`)!;
		app.provide('message', message);
		app.provide('id', id);
		app.provide('data', reactive(data));
		app.provide('element', html);
		app.mount(mount);
		return true;
	}

	/**
	 * @param message - The message to delete
	 */
	delete(message: ChatMessage) {
		this.data.delete(this.messageId(message));
		this.save();
		void message.delete({});
	}

	/**
	 * Retrieves all data for this database, creating it if it doesn't exist.
	 */
	load() {
		game.settings.register(this.moduleId, this.key, {
			scope: 'world'
		});
		const data = game.settings.get(this.moduleId, this.key) as string;
		this.data = (data ? new Map(Object.entries(JSON.parse(data) as Record<string, T>)) : new Map<string, T>());
		rpgm.chat.registerMessageHandler(this);
		this.logger.debug(`Loaded ${this.key} wizard with ${this.data.size} messages`);
	}

	/** Removes any messages that no longer exist. */
	prune() {
		const old_length = this.data.size;
		const message_ids = game.messages.map(m => this.messageId(m));
		this.data = new Map([...this.data]
			.filter(([id]) => message_ids.includes(id)));
		this.save();
		if (old_length > this.data.size)
			this.logger.debug(`Pruned ${this.key} wizard with ${old_length - this.data.size} messages`);
	}

	/** Sync this database's data to localStorage. */
	private save() {
		if (!game.user.isGM) return;
		void game.settings.set(this.moduleId, this.key, JSON.stringify(Object.fromEntries(this.data)));
		// localStorage.setItem(`${this.moduleId}.${this.key}`, JSON.stringify(Object.fromEntries(this.data)));
	}

	/**
	 * A vue composable for grabbing a reactive reference to a message's data.
	 * @param debounce - How often to save data when it gets changed
	 * @returns A reactive reference to the message's data, along with the original message
	 */
	useChatWizard(debounce: number = 1000): WizardData<T> {
		const message = inject('message') as ChatMessage;
		const data = inject('data') as T;
		const id = inject('id') as string;
		const element = inject('element') as HTMLElement;
		const rData = reactive(data);
		const saved = ref(true);
		const close = () => this.delete(message);
		watch(rData, () => { saved.value = false; });
		watchDebounced(rData, () => { this.save(); saved.value = true; }, { debounce });
		return { data: rData, message, id, element, saved, close };
	}
}
