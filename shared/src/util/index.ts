import type { Product } from '@polar-sh/sdk/models/components/product.js';
import {
	createGlobalState,
	useAsyncState,
	useFetch,
	watchDebounced
} from '@vueuse/core';
import type { MaybePromise } from 'fvtt-types/utils';
import { Converter } from 'showdown';
import { shallowReactive } from 'vue';
import { useRouter } from 'vue-router';

import {
	createFoundryAccountCenterUrl,
	isAbsoluteUrl
} from '#/auth/accountCenter';
import { useFoundryAccountBridge } from '#/auth/accountBridge';

/** An object related to various information about a setting */
type SettingsRef<T> = {
	/** The name of the setting */
	name: string;

	/** The hint of the setting */
	hint: string;

	/** The initial value of the setting when queried */
	readonly initial: T;

	/** The value of the setting, not applied until calling {@link SettingsRef.save()} */
	value: T;

	/** Saves this setting's value */
	save(): void;
};

/**
 * Wraps a Foundry setting in a reactive ref. Also returns the initial value.
 * @param path - The setting to reference
 * @returns An object related to various information about a setting
 */
export function useSetting<
	N extends ClientSettings.Namespace,
	K extends ClientSettings.KeyFor<N>,
	KV extends keyof SettingConfig
>(path: KV & `${N}.${K}`, autosave: boolean = false) {
	const [namespace, key] = path.split('.') as [N, K];
	const value = game.settings.get(
		path.split('.')[0] as N,
		path.split('.')[1] as K
	);
	const setting = game.settings.settings.get(path)!;

	const obj = shallowReactive({
		get name() {
			return game.i18n.localize(setting.name ?? '');
		},
		get hint() {
			return game.i18n.localize(setting.hint ?? '');
		},
		initial: value,
		value: value,
		save() {
			void game.settings.set(
				namespace,
				key,
				this.value as ClientSettings.SettingCreateData<N, K>
			);
		}
	}) as SettingsRef<typeof value>;

	if (autosave) {
		watchDebounced(
			() => obj.value,
			() => obj.save(),
			{ debounce: 1000 }
		);
	}

	return obj;
}

export function useFocusCheck(
	check: () => MaybePromise<boolean>,
	maxTimes: number = 10
) {
	let times = maxTimes;
	const update = async () => {
		if (times-- <= 0 || (await check())) {
			window.removeEventListener('focus', update);
		}
	};
	return () => {
		window.removeEventListener('focus', update);
		times = maxTimes;
		window.addEventListener('focus', update);
	};
}

export const useSubscription = createGlobalState(() => {
	const accountBridge = useFoundryAccountBridge();
	const subscription = computed(() => {
		const snapshot = accountBridge.snapshot.value;

		if (snapshot.status !== 'available') {
			return null;
		}

		const membershipStatus = snapshot.membershipStatus?.trim() ?? null;
		const normalizedStatus = membershipStatus?.toLowerCase() ?? null;
		const hasActiveMembership =
			normalizedStatus === 'active' ||
			(!normalizedStatus && Boolean(snapshot.activeTierName));

		return {
			tierName: snapshot.activeTierName,
			membershipStatus,
			hasActiveMembership,
			needsAttention: Boolean(snapshot.activeTierName) && !hasActiveMembership
		};
	});
	const update = async () => {
		await accountBridge.refresh();
		return subscription.value;
	};
	const state = {
		isLoading: computed(() => accountBridge.isLoading.value),
		subscription,
		update,
		async then() {
			await update();
			return Promise.resolve(state);
		}
	};
	return state;
});

export const useAccounts = createGlobalState(() => {
	const {
		isLoading,
		state: accounts,
		execute: update
	} = useAsyncState(
		() => rpgm.auth.listAccounts().then(({ data }) => data ?? []),
		[],
		{ immediate: false, resetOnExecute: false }
	);
	const state = {
		isLoading,
		accounts,
		update,
		async then() {
			await update();
			return Promise.resolve(state);
		}
	};
	return state;
});

export const useProducts = createGlobalState(() => {
	// const skipCache = false;
	const skipCache = import.meta.env.DEV;
	return useAsyncState(
		() =>
			rpgm
				.getApiListProducts({
					query: {
						'skip-cache': skipCache
					}
				})
				.then(({ data }) => {
					type RProduct = Exclude<typeof data, undefined>[number];
					type NProduct = Pick<
						Product & { slug: string },
						keyof RProduct
					>;
					return data as NProduct[] | undefined;
				}),
		null,
		{ immediate: false, resetOnExecute: false }
	);
});

export function an(t: string) {
	return t.match(/^[aeiouAEIOU]/) ? 'an' : 'a';
}

const DEFAULT_SIGNED_IN_REQUIRED_FALLBACK_ROUTE = createFoundryAccountCenterUrl(
	{
		baseUrl: __API_URL__,
		focus: 'session'
	}
);

export function useSignedInRequired(
	fallbackRoute: string = DEFAULT_SIGNED_IN_REQUIRED_FALLBACK_ROUTE
) {
	const accountBridge = useFoundryAccountBridge();
	const router = useRouter();

	watch(
		[
			() => accountBridge.hasLoadedOnce.value,
			() => accountBridge.isLoading.value,
			() => accountBridge.snapshot.value.status
		],
		([hasLoadedOnce, isLoading, status]) => {
			if (!hasLoadedOnce || isLoading || status !== 'signed-out') {
				return;
			}

			if (isAbsoluteUrl(fallbackRoute)) {
				globalThis.location.assign(fallbackRoute);
				return;
			}

			router.push(fallbackRoute);
		},
		{ immediate: true }
	);
}

const texts = new Map<string, string>();
export function useMarkdown(url: string) {
	const fetch = useFetch<string>(url, { immediate: false });
	const converter = new Converter();
	const markdown = computed(() => {
		const cached = texts.get(url);
		if (cached) return cached;

		fetch.execute().then(() => {
			texts.set(url, fetch.data.value ?? '');
		});

		return fetch.data.value ?? '';
	});

	return computed(() => converter.makeHtml(markdown.value));
}
