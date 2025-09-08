<script setup lang="ts">
import type { Product as PolarProduct } from '@polar-sh/sdk/models/components/product';
import { useFetch } from '@vueuse/core';
import * as z from 'zod/mini';

import ProgressiveImage from '#/util/ProgressiveImage.vue';
import SignedIn from '#/util/SignedIn.vue';
import StaggeredTransitionGroup from '#/util/StaggeredTransitionGroup';
import { LoadingBoundry } from '#/util/useLoading';

import SignIn from './SidebarAccount/SignIn.vue';

const onResize = inject<(forceCenter?: boolean) => void>('onResize');

const { updateBalance } = rpgm.usePolyhedriumBalance();

type Product = PolarProduct & { slug: string };

const { isFetching, data } = useFetch(__API_URL__ + '/api/list-products').json<Product[]>();

watch(isFetching, () => {
	onResize?.(true);
});

onMounted(updateBalance);

// Disable all buttons while checking out
const checkingOutLoading = ref(false);
// const subscriptions = computed(() => data.value?.filter(item => item.isRecurring).sort(sortByPrice));
const products = computed(() => data.value?.filter(item => !item.isRecurring).sort(sortByPrice));

const tagSchema = z.object({
	name: z.string(),
	desc: z.string(),
	icon: z.optional(z.string())
});

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

// After checking out, update the balance each time the window focuses, up to 10 times
function updateForABit() {
	window.removeEventListener('focus', update);
	let i = 10;
	function update() {
		updateBalance().then(([n, o]) => {
			if (n !== o)
				window.removeEventListener('focus', update);
		});
		if (--i < 0) {
			window.removeEventListener('focus', update);
		}
	}
	window.addEventListener('focus', update);
}

async function checkout(item: Product) {
	checkingOutLoading.value = true;
	return rpgm.auth.checkout({ slug: item.slug }).then((r) => {
		checkingOutLoading.value = false;
		if (r.error) return;
		window.open(r.data.url, '_blank');
		updateForABit();
	});
}

async function openPortal() {
	return rpgm.auth.customer.portal().then(portal => {
		if (portal.error) return;
		window.open(portal.data.url, '_blank');
	});
}

function priceText(prices: Product['prices']) {
	const price = prices[0];
	if (price.type === 'recurring' && price.amountType === 'fixed') {
		return `$${price.priceAmount / 100} / ${price.recurringInterval}`;
	} else if (price.type === 'one_time' && price.amountType === 'fixed') {
		return `$${price.priceAmount / 100}`;
	}
}
</script>

<template>
	<NCard>
		<Transition name="rpgm-fade">
			<SignedIn>
				<template #not-signed-in>
					<SignIn />
				</template>
				<div
					v-if="!isFetching"
					class="shop-items"
				>
					<h1>Products</h1>
					<NList style="background: transparent;">
						<StaggeredTransitionGroup
							appear
							name="rpgm-stagger"
							:delay="0"
						>
							<NListItem
								v-for="item in products"
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
												:src="getSmallestMedia(item.medias).publicUrl"
											/>
										</div>
									</template>
									{{ item.description }}
									<template #description>
										<NFlex vertical>
											<NH3
												strong
												style="border: none;"
												prefix="bar"
												type="default"
											>
												{{ priceText(item.prices) }} 
											</NH3>
											<NFlex size="small">
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
										</NFlex>
									</template>
									<template #footer />
									<template #action>
										<LoadingBoundry #="{ loading, start }">
											<NFlex vertical>
												<NButton
													type="primary"
													:loading="loading.value"
													@click="start(checkout(item))"
												>
													Buy
												</NButton>
											</NFlex>
										</LoadingBoundry>
									</template>
								</NThing>
							</NListItem>
						</StaggeredTransitionGroup>
					</NList>
					<LoadingBoundry #="{ loading, start }">
						<button
							class="rpgm-button rpgm-button-primary"
							:disabled="loading.value"
							:data-loading="loading.value"
							@click="start(openPortal())"
						>
							Open Portal
						</button>
					</LoadingBoundry>
				</div>
				<NEmpty
					v-else
					description="Loading..."
				>
					<template #icon>
						<NSpin />
					</template>
				</NEmpty>
			</SignedIn>
		</Transition>
	</NCard>
</template>

<style>
li:nth-child(even) .n-thing .n-thing-avatar-header-wrapper {
	flex-direction: row-reverse;
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
