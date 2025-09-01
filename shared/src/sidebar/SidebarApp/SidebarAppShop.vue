<script setup lang="ts">
import type { Product as PolarProduct } from '@polar-sh/sdk/models/components/product';
import { useFetch } from '@vueuse/core';

import ProgressiveImage from '#/util/ProgressiveImage.vue';
import StaggeredTransitionGroup from '#/util/StaggeredTransitionGroup';
import { LoadingBoundry } from '#/util/useLoading';

const session = rpgm.auth.useSession();

const { updateBalance } = rpgm.usePolyhedriumBalance();

const loggedIn = computed(() => Boolean(session.value.data));

type Product = PolarProduct & { slug: string };

const { isFetching, data } = useFetch(__API_URL__ + '/api/list-products').json<Product[]>();

onMounted(updateBalance);

// Disable all buttons while checking out
const checkingOutLoading = ref(false);
const subscriptions = computed(() => data.value?.filter(item => item.isRecurring).sort(sortByPrice));
const products = computed(() => data.value?.filter(item => !item.isRecurring).sort(sortByPrice));

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
	<div v-if="!isFetching" class="shop-items">
		<h1>Subscriptions</h1>
		<div>
			<StaggeredTransitionGroup appear name="rpgm-stagger" :delay="0">
				<div v-for="item in subscriptions" :key="item.id" :data-item-id="item.id" class="shop-item">
					<h4 class="shop-item-name">
						{{ item.name }}
					</h4>
					<span>{{ priceText(item.prices) }} </span>
					<div>
						<ProgressiveImage v-if="item.medias.length > 0" :src="getSmallestMedia(item.medias).publicUrl" />
						<p class="shop-item-description">
							{{ item.description }}
						</p>
					</div>
					<LoadingBoundry #="{ loading, start }">
						<button :disabled="!loggedIn || loading.value || checkingOutLoading" :data-loading="loading.value"
							class="rpgm-button rpgm-button-primary" @click="start(checkout(item))">
							{{ loggedIn ? "Buy" : "Sign In to Buy" }}
						</button>
					</LoadingBoundry>
				</div>
			</StaggeredTransitionGroup>
		</div>
		<h1 style="margin-top: 32px;">Products</h1>
		<div>
			<StaggeredTransitionGroup appear name="rpgm-stagger" :delay="0">
				<div v-for="item in products" :key="item.id" :data-item-id="item.id" class="shop-item">
					<h4 class="shop-item-name">
						{{ item.name }}
					</h4>
					<span>{{ priceText(item.prices) }} </span>
					<div>
						<ProgressiveImage v-if="item.medias.length > 0" :src="getSmallestMedia(item.medias).publicUrl" />
						<p class="shop-item-description">
							{{ item.description }}
						</p>
					</div>
					<LoadingBoundry #="{ loading, start }">
						<button :disabled="!loggedIn || loading.value || checkingOutLoading" :data-loading="loading.value" class="rpgm-button rpgm-button-primary" @click="start(checkout(item))">
							{{ loggedIn ? "Buy" : "Sign In to Buy" }}
						</button>
					</LoadingBoundry>
				</div>
			</StaggeredTransitionGroup>
		</div>
		<LoadingBoundry #="{ loading, start }">
			<button class="rpgm-button rpgm-button-primary" :disabled="loading.value" :data-loading="loading.value" @click="start(openPortal())">
				Open Portal
			</button>
		</LoadingBoundry>
	</div>
	<p v-else style="min-height: 500px;">Loading...</p>
</template>

<style scoped>
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
	border-radius: 4px;
	max-height: 100px;
}

.shop-item-description {
	color: #bbb;
}
</style>
