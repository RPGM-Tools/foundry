<script setup lang="ts">
import type { Product as PolarProduct } from "@polar-sh/sdk/models/components/product";
import { useFetch } from '@vueuse/core';

import ProgressiveImage from '#/util/ProgressiveImage.vue';
import StaggeredTransitionGroup from '#/util/StaggeredTransitionGroup';

const session = rpgm.auth.useSession();

const { updateBalance } = rpgm.usePolyhedriumBalance();

const loggedIn = computed(() => Boolean(session.value.data));

type Product = PolarProduct & { slug: string };

const { isFetching, data } = useFetch(__API_URL__ + '/api/list-products').json<Product[]>();

onMounted(updateBalance);

const subscriptions = computed(() => data.value?.filter(item => item.isRecurring).sort(sortByPrice));
const products = computed(() => data.value?.filter(item => !item.isRecurring).sort(sortByPrice));

function sortByPrice(a: Product, b: Product) {
	if (a.prices[0].amountType === "fixed" && b.prices[0].amountType === "fixed") {
		return a.prices[0].priceAmount - b.prices[0].priceAmount;
	}
	return 0;
}

function getSmallestMedia(medias: Product["medias"]) {
	return medias.sort((a, b) => b.size - a.size)[0];
}

async function checkout(item: Product) {
	const checkout = await rpgm.auth.checkout({ slug: item.slug });

	if (checkout.error) return;
	window.open(checkout.data.url, "_blank");
	window.addEventListener("focusin", () => {
		updateBalance();
	}, { once: true });
}

async function openPortal() {
	rpgm.auth.customer.portal().then(portal => {
		if (portal.error) return;
		window.open(portal.data.url, "_blank");
	});
}

function priceText(prices: Product["prices"]) {
	const price = prices[0];
	if (price.type === "recurring" && price.amountType === "fixed") {
		return `$${price.priceAmount / 100} / ${price.recurringInterval}`;
	} else if (price.type === "one_time" && price.amountType === "fixed") {
		return `$${price.priceAmount / 100}`;
	}
}
</script>

<template>
	<div v-if="!isFetching" class="shop-items">
		<h1>Subscriptions</h1>
		<div>
			<StaggeredTransitionGroup appear name="rpgm-stagger" :delay="100">
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
					<button :disabled="!loggedIn" @click="checkout(item)">{{ loggedIn ? "Buy" : "Sign In to Buy" }}</button>
				</div>
			</StaggeredTransitionGroup>
		</div>
		<h1 style="margin-top: 32px;">Products</h1>
		<div>
			<StaggeredTransitionGroup appear name="rpgm-stagger" :delay="100">
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
					<button :disabled="!loggedIn" @click="checkout(item)">{{ loggedIn ? "Buy" : "Sign In to Buy" }}</button>
				</div>
			</StaggeredTransitionGroup>
		</div>
		<button @click="openPortal">Open Portal</button>
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
