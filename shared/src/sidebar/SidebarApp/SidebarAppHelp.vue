<script setup lang="ts">
const helpPages = Object.fromEntries(rpgm.help.pages);
</script>

<template>
	<div>
		<RouterLink
			v-for="(page, id) in helpPages"
			:key="id"
			custom
			:to="`/help/${id}`"
			#="{ navigate }"
		>
			<a @click="navigate">{{ page.name }}</a>
		</RouterLink>
	</div>
</template>

<style scoped>
.help {
	white-space: pre-wrap;
}

.help *:not(ul) {
	padding: 0;
	margin: 0;
}

.divider {
	width: 100%;
	height: 1px;
	background-color: #aaa;
}
</style>
