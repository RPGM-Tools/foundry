import { createGlobalState, useThrottleFn } from '@vueuse/core';

export const usePolyhedriumBalance = createGlobalState(() => {
	const balance = ref<number>();
	const session = rpgm.auth.useSession();

	watch(session, (newSession, oldSession) => {
		// Reset balance when logging out
		if (newSession.data === null)
			balance.value = undefined;
		// Update balance on logging in
		else if (oldSession.data === null)
			balance.value = newSession.data.user.polyhedrium;
	});

	return {
		balance,
		update: useThrottleFn(async () => {
			const oldBalance = balance.value;
			if (session.value.data) {
				const v = await rpgm.getApiPolyhedrium();
				if (v.data) balance.value = v.data;
			} else {
				balance.value = undefined;
			}
			return [balance.value, oldBalance] as const;
		}, 4000)
	};
});
