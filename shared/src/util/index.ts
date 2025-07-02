import { watchDebounced } from '@vueuse/core';
import { shallowReactive } from 'vue';

/** An object related to various information about a setting */
type SettingsRef<T> = {
	/** The name of the setting */
	name: string
	/** The hint of the setting */
	hint: string
	/** The initial value of the setting when queried */
	readonly initial: T
	/** The value of the setting, not applied until calling {@link SettingsRef.save()} */
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
	V extends ClientSettings.SettingCreateData<N, K>,
	KV extends keyof SettingConfig>(
		path: KV,
		autosave: boolean = false,
	) {
	const setting = game.settings.settings.get(path)!;
	const namespace = setting.namespace as N;
	const key = setting.key as K;
	const value = game.settings.get(namespace, key) as V;

	const obj = shallowReactive({
		get name() { return game.i18n.localize(setting.name ?? ""); },
		get hint() { return game.i18n.localize(setting.hint ?? ""); },
		initial: value,
		value: value,
		save() {
			void game.settings.set(namespace, key, this.value);
		}
	}) as SettingsRef<V>;

	if (autosave) {
		watchDebounced(() => obj.value, () => obj.save(), { debounce: 1000 });
	}

	return obj;
}
