import { shallowReactive } from 'vue';

/** An object related to various information about a setting */
type SettingsRef<T> = {
	name: string
	hint: string
	/** The initial value of the setting when queried */
	readonly initial: T
	/** The value of the setting, not applied until calling apply() */
	value: T
	/** Saves this setting's value */
	save(): void
}

/**
 * Wraps a Foundry setting in a reactive ref. Also returns the initial value.
 * @param path - The setting to reference
 * @returns An object related to various information about a setting
 */
export function useSetting<
	N extends ClientSettings.Namespace,
	K extends ClientSettings.KeyFor<N>,
	V extends ClientSettings.SettingAssignmentType<N, K>,
	KV extends keyof SettingConfig>(
		path: KV,
	) {
	const setting = game.settings.settings.get(path)!;
	const namespace = setting.namespace as N;
	const key = setting.key as K;
	const value = game.settings.get(namespace, key) as V;
	return shallowReactive({
		get name() { return game.i18n.localize(setting.name ?? ""); },
		get hint() { return game.i18n.localize(setting.hint ?? ""); },
		initial: value,
		value: value,
		save() {
			void game.settings.set(namespace, key, this.value);
		}
	}) as SettingsRef<V>;
}
