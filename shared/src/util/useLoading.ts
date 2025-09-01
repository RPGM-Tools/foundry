import { type SlotsType } from 'vue';

type UseLoading = ReturnType<typeof useLoading>;

/**
 * Composable for managing loading states in components.
 * Provides reactive loading state and helper functions to start/finish loading.
 * Prevents concurrent loading operations by ignoring start calls when already loading.
 */
export function useLoading() {
	const loading = ref(false);
	const finish = () => loading.value = false;
	return {
		/** Reactive loading state. True when loading is in progress, false otherwise. */
		loading: readonly(loading),

		/**
		 * Start loading state, optionally return the result of the passed function. 
		 * If loading is already in progress, returns undefined without executing the function.
		 * @param func - Optional promise to execute while loading
		 * @returns The result of the passed function, or undefined if loading is already in progress
		 */
		async start<T>(func?: Promise<T>): Promise<T | undefined> {
			if (loading.value) return;
			loading.value = true;
			if (!func) return;
			func.finally(finish);
			return func;
		},

		/** Finish loading state by setting loading to false. */
		finish
	};
}

export const LoadingBoundry = defineComponent({
	name: 'LoadingBoundry',

	slots: Object as SlotsType<{
		default: (scope: UseLoading) => VNode[]
	}>,

	setup(_, { slots }) {
		const l = useLoading();
		return () => slots.default?.(l);
	}
});
