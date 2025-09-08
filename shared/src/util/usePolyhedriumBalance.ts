import { useThrottleFn } from '@vueuse/core';

export function rpgmPolyhedriumBalance() {
	const balance = ref(0);
	const session = rpgm.auth.useSession();

	watch(session, (newSession, oldSession) => {
		// Reset balance when logging out
		if (newSession.data === null)
			balance.value = 0;
		// Update balance on logging in
		else if (newSession.data !== null && oldSession.data === null)
			balance.value = newSession.data.user.polyhedrium;
	});

	async function update() {
		const oldBalance = balance.value;
		if (session.value.data) {
			await rpgm.auth.$fetch<number>(__API_URL__ + '/api/get-polyhedrium', {
				onSuccess: ctx => void (balance.value = ctx.data)
			});
		} else balance.value = 0;
		return [balance.value, oldBalance] as const;
	}

	const updateBalance = useThrottleFn(update, 4000);

	return () => ({
		balance: balance,
		updateBalance
	});
}
