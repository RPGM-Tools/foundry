<script setup lang="ts">
import WriteOnTransition from "#/util/WriteOnTransition.vue";

const data = inject<ForgeChatHomebrew>("data")!;

const { currentTitle } = defineProps<{
	currentTitle: string
	editing: boolean
	canGotoGenerations: boolean
}>();

const emit = defineEmits<{
	cycle: [by: number]
	click: [event: MouseEvent]
	gotoGenerations: []
}>();
</script>

<template>
	<div class="rpgm-homebrew-title-container" :title="!editing ? 'Click to edit' : ''" @click="emit('click', $event)"
		:editing>
		<WriteOnTransition :duration="400">
			<h1 :key="currentTitle" ref="title" v-if="currentTitle" class="rpgm-homebrew-title">
				{{ currentTitle }}
			</h1>
		</WriteOnTransition>
		<div v-if="!editing && Object.keys(data.generations).length > 1" class="rpgm-icons">
			<a @click.stop="emit('cycle', -1)" title="Previous generation"><i class="fa-solid fa-circle-left" /></a>
			<a @click.stop="emit('cycle', 1)" title="Next generation"><i class="fa-solid fa-circle-right" /></a>
		</div>
		<div v-else-if="editing" class="rpgm-icons">
			<a @click.stop="emit('gotoGenerations')" v-if="canGotoGenerations" style="margin-left: auto;"
				title="View all generations"><i class="fa-solid fa-cubes-stacked" /></a>
		</div>
	</div>
</template>

<style>
.rpgm-homebrew-title-container {
	position: relative;
	border-radius: 6px;
	padding-bottom: 4px;
	padding-top: 1px;
	padding-left: 4px;
	padding-right: 4px;
	transition: all 0.2s ease;
}

.rpgm-homebrew-title-container[editing="false"]:hover:not(:has(.rpgm-icons:hover)) {
	cursor: pointer;
	backdrop-filter: brightness(0.75);
}

.rpgm-homebrew-title-container {
	.rpgm-icons {
		opacity: 1;
		filter: blur(0px);
	}
}

.rpgm-homebrew-title {
	font-size: 20px;
	text-align: center;
	font-weight: bolder;
	margin-top: 8px;
	margin-bottom: 0px;
	padding-left: 20px;
	padding-right: 20px;
}

.rpgm-homebrew-title-container .rpgm-icons {
	padding-left: 2px;
	padding-right: 2px;
	top: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transform: translateX(-50%);
	left: 50%;
}
</style>
