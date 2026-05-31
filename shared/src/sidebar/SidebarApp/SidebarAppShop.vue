<script setup lang="ts">
/*
	SidebarAppShop.vue
	Purpose: Show the public membership catalog while routing membership changes
	through the hosted RPGM Tools account center during the Forge 2.x bridge.
*/
// import type { Product } from '@polar-sh/sdk/models/components/product';
import { Converter } from 'showdown';
import * as z from 'zod/mini';

import { useFoundryAccountBridge } from '#/auth/accountBridge';
import CustomerPortalButton from '#/components/CustomerPortalButton.vue';
import SubscriptionInfoAlert from '#/components/SubscriptionInfoAlert.vue';
import SubscriptionWarningAlert from '#/components/SubscriptionWarningAlert.vue';
import { useResize } from '#/sidebar';
import { useFocusCheck, useProducts, useSignedInRequired, useSubscription } from '#/util';
import ProgressiveImage from '#/util/ProgressiveImage.vue';
import { LoadingBoundry } from '#/util/useLoading';

const onResize = useResize();
const accountBridge = useFoundryAccountBridge();

// const { update } = rpgm.usePolyhedriumBalance();

const { state: products, execute: updateProducts } = useProducts();

type Product = NonNullable<typeof products.value>[number];

const { subscription, update: updateSubscription } = useSubscription();

const subscriptionActive = computed(() => Boolean(subscription.value?.hasActiveMembership));
const subscriptionCanceling = computed(() => Boolean(subscription.value?.needsAttention));

watch(products, () => {
	onResize?.(true);
});

const subscriptionCheck = useFocusCheck(async () => {
	const oldStatus = accountBridge.snapshot.value.membershipStatus;
	const oldTierName = accountBridge.snapshot.value.activeTierName;
	await updateSubscription();
	return (
		accountBridge.snapshot.value.membershipStatus !== oldStatus ||
		accountBridge.snapshot.value.activeTierName !== oldTierName
	);
});

useSignedInRequired();

// onMounted(update);

// Disable all buttons while checking out
const checkingOutLoading = ref(false);
// const subscriptions = computed(() => data.value?.filter(item => item.isRecurring).sort(sortByPrice));
const subscriptionProducts = computed(() => products.value?.filter(item => item.isRecurring).sort(sortByPrice));

const tagSchema = z.object({
	name: z.string(),
	desc: z.string(),
	icon: z.optional(z.string())
});

if (!subscription.value || !products.value) {
	await Promise.all([
		updateSubscription(),
		updateProducts()
	]);
} else {
	updateProducts();
	updateSubscription();
}

function getTags(item: Product) {
	const tags = [];
	for (const [k, v] of Object.entries(item.metadata)) {
		const [_k, id] = k.split('tag:', 2) as [string, string | undefined];
		if (id) {
			try {
				const value = JSON.parse(v as string);
				const t = tagSchema.parse(value);
				tags.push({ ...t, id });
			} catch { ; }
		}
	}
	return tags;
}

function sortByPrice(a: Product, b: Product) {
	if (a.prices[0].amountType === 'fixed' && b.prices[0].amountType === 'fixed') {
		return a.prices[0].priceAmount - b.prices[0].priceAmount;
	}
	return 0;
}

function getSmallestMedia(medias: Product['medias']) {
	return medias.sort((a, b) => b.size - a.size)[0];
}

// const updateForABit = useFocusCheck(() => update().then(([n, o]) => n !== o));

async function checkout(item: Product) {
	checkingOutLoading.value = true;
	accountBridge.openForgeMembership();
	checkingOutLoading.value = false;
	subscriptionCheck();
	return Promise.resolve(item.slug);
}


function priceText(prices: Product['prices']) {
	const price = prices[0];
	if (price.type === 'recurring' && price.amountType === 'fixed') {
		return `$${price.priceAmount / 100} / ${price.recurringInterval}`;
	} else if (price.type === 'one_time' && price.amountType === 'fixed') {
		return `$${price.priceAmount / 100}`;
	}
}

const mdConverter = new Converter();
function formattedDescription(item: Product) {
	return mdConverter.makeHtml(item.description!);
}

function hasActiveTier(item: Product) {
	const activeTierName = subscription.value?.tierName?.trim().toLowerCase();
	return Boolean(activeTierName && item.name.trim().toLowerCase() === activeTierName);
}
</script>

<template>
	<NCard>
		<NFlex vertical>
			<div style="position: relative;">
				<Transition name="rpgm-fade">
					<SubscriptionWarningAlert
						v-if="subscriptionCanceling"
						:show-button="false"
					/>
					<SubscriptionInfoAlert
						v-else-if="subscriptionActive"
						:show-button="false"
					/>
				</Transition>
			</div>
			<NCard title="Subscriptions">
				<NList style="background: transparent;">
					<NListItem
						v-for="item in subscriptionProducts"
						:key="item.id"
					>
						<NThing
							:title="item.name"
							class="shop-item"
						>
							<template #avatar>
								<div style="height: 100%;">
									<ProgressiveImage
										style="object-fit: cover; height: 100%;"
										:src="getSmallestMedia(item.medias)?.publicUrl"
									/>
								</div>
							</template>
							<p
								v-if="item.description"
								v-html="formattedDescription(item)"
							/>
							<template #description>
								<NText type="success">
									{{ priceText(item.prices) }} 
								</NText>
								<NFlex
									size="small"
									class="shop-item-tags"
								>
									<NTooltip
										v-for="tag in getTags(item)"
										:key="tag.name"
									>
										<template #trigger>
											<NTag type="info">
												{{ tag.name }}
												<template
													v-if="tag.icon"
													#icon
												>
													<NIcon size="medium">
														<i :class="tag.icon" />
													</NIcon>
												</template>
											</NTag>
										</template>
										{{ tag.desc }}
									</NTooltip>
								</NFlex>
							</template>
							<template #footer />
							<template #action>
								<LoadingBoundry #="{ loading, start }">
									<NFlex vertical>
										<NButton
											:type="hasActiveTier(item) ? 'success' : 'primary'"
											:ghost="hasActiveTier(item)"
											:loading="loading.value"
											@click="start(checkout(item))"
										>
											{{ hasActiveTier(item) ? 'Membership Active' : subscriptionActive ? 'Manage on RPGM Tools' : 'Open on RPGM Tools' }}
										</NButton>
									</NFlex>
								</LoadingBoundry>
							</template>
						</NThing>
					</NListItem>
				</NList>
			</NCard>
			<NFlex
				vertical
			>
				<CustomerPortalButton
					size="large"
					secondary
				/>
			</NFlex>
		</NFlex>
	</NCard>
</template>

<style>
li:nth-child(odd) .shop-item.n-thing {
	.n-thing-avatar-header-wrapper {
		flex-direction: row-reverse;
	}
	.n-thing-avatar {
		margin: 2px 0 0 12px;
	}
}

.shop-item {
	.n-thing-header__title {
		width: 100%;
	}
	.n-thing-header-wrapper {
		text-align: center;
	}
	.shop-item-tags {
		justify-content: center !important;
	}
}

.shop-item .n-thing-header-wrapper {
	align-content: space-evenly;
}

.shop-item:not(:last-child) {
	border-bottom: 1px solid #ccc;
	padding-bottom: 8px;
	margin-bottom: 8px;
}

.shop-item-name {
	font-weight: bold;
	font-size: 1.1rem;
}

.shop-item img {
	float: right;
	margin: 2px;
	aspect-ratio: unset !important;
	border-radius: 4px;
	max-width: 100px;
	/* max-height: 100px; */
}

.shop-item-description {
	color: #bbb;
}
</style>
