import { createGlobalState, useThrottleFn } from '@vueuse/core';

import { useFoundryAccountBridge } from '#/auth/accountBridge';

export const usePolyhedriumBalance = createGlobalState(() => {
	const balance = ref<number>();
	const accountBridge = useFoundryAccountBridge();

	watch(
		() => accountBridge.snapshot.value,
		snapshot => {
			if (snapshot.status !== 'available') {
				balance.value = undefined;
				return;
			}

			balance.value = snapshot.spendableOre ?? undefined;
		},
		{ immediate: true }
	);

	return {
		balance,
		update: useThrottleFn(async () => {
			const oldBalance = balance.value;
			await accountBridge.refresh();
			if (accountBridge.snapshot.value.status !== 'available') {
				balance.value = undefined;
			} else {
				balance.value =
					accountBridge.snapshot.value.spendableOre ?? undefined;
			}
			return [balance.value, oldBalance] as const;
		}, 4000)
	};
});
