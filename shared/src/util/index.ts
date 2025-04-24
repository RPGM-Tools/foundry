import { shallowReactive } from 'vue';

type SettingsRef<T> = {
	name: string
	hint: string
	readonly initial: T
	value: T
	apply(): void
}

/** Wraps a Foundry setting in a reactive ref. Also returns the initial value. */
export function useSetting<N extends ClientSettings.Namespace, K extends ClientSettings.KeyFor<N>,
	V = ClientSettings.SettingInitializedType<N, K>>(
		namespace: N,
		key: K,
	) {
	const setting = game.settings.settings.get(`${namespace}.${key}`);
	const value = game.settings.get(namespace, key);
	return shallowReactive({
		get name() { return game.i18n.localize(setting!.name ?? ""); },
		get hint() { return game.i18n.localize(setting!.hint ?? ""); },
		initial: value as V,
		value: value as V,
		apply() {
			void game.settings.set(namespace, key, this.value as ClientSettings.SettingAssignmentType<N, K>);
		}
	}) as SettingsRef<V>;
}
