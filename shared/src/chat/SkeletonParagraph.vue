<template>
	<Transition :name="loading ? 'loading' : 'unloading'">
		<div
			v-if="loading"
			class="outer"
		>
			<div class="line rpgm-active" />
			<div class="line rpgm-active" />
			<div class="line rpgm-active" />
			<div class="line rpgm-active" />
		</div>
		<slot v-else />
	</Transition>
</template>

<script setup lang="ts">
defineProps<{ loading: boolean }>();
</script>

<style scoped>
.unloading-enter-active,
.unloading-leave-active,
.loading-enter-active,
.loading-leave-active {
	transition: all 0.5s ease-in-out;
}

.unloading-enter-active,
.loading-leave-active {
	position: absolute;
}

.unloading-enter-from,
.unloading-leave-to {
	left: 100%;
	opacity: 0;
}

.unloading-leave-from,
.unloading-enter-to {
	left: 0;
	opacity: 1;
}

.loading-enter-from,
.loading-leave-to {
	left: 100%;
	opacity: 0;
}

.loading-leave-from,
.loading-enter-to {
	left: 0;
	opacity: 1;
}

.outer {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.line {
	width: 100%;
	height: 16px;
	/* background-image: linear-gradient(90deg, #ffffffae, #9933cc44, #ffffffae); */
	/* background-size: 600px; */
	border-radius: 4px;
}

.line:last-child {
	width: 90%;
}

@keyframes shine {
	0% {
		background-position: 300px 0px;
	}

	100% {
		background-position: 900px 0px;
	}
}
</style>
