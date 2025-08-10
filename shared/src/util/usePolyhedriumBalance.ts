import { useThrottleFn } from "@vueuse/core";

type PolyhedriumBalance = {
	loading: Ref<true>;
	balance: Ref<undefined>;
	updateBalance: () => void;
} | {
	loading: Ref<false>;
	balance: Ref<number>;
	updateBalance: () => void;
};

export function rpgmPolyhedriumBalance() {
	const balance = ref<number>();
	const session = rpgm.auth.useSession();
	const loading = ref(false);

	async function update() {
		try {
			if (!session.value.data) return;
			loading.value = balance.value === undefined;
			const meters = await rpgm.auth.usage.meters.list({ query: {} });
			loading.value = false;
			if (meters.error) return;
			const b = meters.data.result.items.find(item => item.meter.name === "Polyhedrium")?.balance;
			if (b && balance.value === undefined) balance.value = 0;
			balance.value = b;
		} catch { return; }

	}

	const updateBalance = useThrottleFn(update, 4000);

	return () => ({
		loading,
		balance: readonly(balance),
		updateBalance,
	} as PolyhedriumBalance);
}
