<script setup lang="ts">
import { useFetch } from '@vueuse/core';
import axios from 'axios';

import ProgressiveImage from "#/util/ProgressiveImage.vue";
import StaggeredTransitionGroup from "#/util/StaggeredTransitionGroup";
import IsLoggedIn from "#/xsolla/IsLoggedIn.vue";

const onResize = inject<() => void>('onResize');

type Item = {
	item_id: string;
	name: string;
	sku: string;
	description: string;
	image_url: string;
	price: {
		amount: string;
		amount_without_discount: string;
		currency: string;
	};
};

const { isFetching, data, error } = useFetch(`https://store.xsolla.com/api/v2/project/${__XSOLLA_PROJECT_ID__}/items/virtual_currency/package`).get().json<{ items: Item[] }>();

const sortedItems = computed(() => {
	onResize?.();
	return data.value?.items.sort((a, b) => a.sku.localeCompare(b.sku)) ?? [];
});

const parseDescription = (description: string) => {
	return description.replace(/\n/g, '<br>');
};

const openPurchase = (item: Item) => {
	axios.post(`https://store.xsolla.com/api/v2/project/${__XSOLLA_PROJECT_ID__}/payment/item/${item.sku}`, {
		sandbox: true,
		settings: {
			ui: {
				theme: "63295aab2e47fab76f7708e3",
				desktop: {
					header: {
						is_visible: true,
						visible_logo: true,
					}
				}
			}
		}
	}, {
		headers: {
			"Authorization": `Bearer ${rpgm.loginToken}`
		}
	}).then(res => {
		window.open(`https://sandbox-secure.xsolla.com/paystation4/?token=${res.data.token}`);
	}).catch(error => {
		rpgm.logger.error("Failed to open purchase", error);
	});
};
</script>

<template>
	<div style="min-height: 100vh;">
		<p v-if="isFetching" style="text-align: center;">Loading...</p>
		<template v-else>
			<StaggeredTransitionGroup tag="div" name="rpgm-stagger" class="shop-items">
				<div v-for="item in sortedItems" :key="item.item_id" style="padding: 2px" class="shop-item">
					<span>
						<ProgressiveImage :src="item.image_url" />
						<span class="shop-item-name">{{ item.name }}</span>
						<br>
						<span>
							{{ item.price.amount }}
							<s v-if="item.price.amount_without_discount < item.price.amount">
								{{ item.price.amount_without_discount }}
							</s>
							{{ item.price.currency }}
						</span>
					</span>
					<p class="shop-item-description" v-html="parseDescription(item.description)" />
					<IsLoggedIn>
						<button @click="openPurchase(item)">Buy</button>
						<template #not-logged-in>
							<button :disabled="true" style="pointer-events: none;"><i>Login to buy</i></button>
						</template>
					</IsLoggedIn>
				</div>
			</StaggeredTransitionGroup>
		</template>
		<p v-if="error">Failed to load shop :/</p>
	</div>
</template>

<style scoped>
.shop-items {
	position: relative;
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
	border-radius: 4px;
	max-height: 100px;
	display: inline;
}

.shop-item-description {
	color: #bbb;
}
</style>
