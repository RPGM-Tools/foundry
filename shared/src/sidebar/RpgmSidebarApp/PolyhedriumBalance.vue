<script setup lang="ts">
import type { Property } from "csstype";

import AnimatedNumber from '#/util/AnimatedNumber';
import LoggedIn from "#/util/LoggedIn.vue";

const { balance, loading } = rpgm.usePolyhedriumBalance();

const { align = 'center center' } = defineProps<{
	align?: Property.TransformOrigin
}>();
</script>

<template>
	<LoggedIn>
		<AnimatedNumber v-bind="$attrs" :value="balance" #="{ display, direction }" :duration="3000">
			<span v-if="loading">...</span>
			<span v-else class="balance-outer" :style="{ transformOrigin: align }"
				:class="{ increasing: direction > 0, decreasing: direction < 0 }">
				<span class="balance-inner" :class="{ increasing: direction > 0, decreasing: direction < 0 }">
					{{ display }}
				</span>
			</span>
		</AnimatedNumber>
		<template #not-logged-in>
			Log in to see your balance
		</template>
	</LoggedIn>
</template>

<style scoped>
.balance-outer {
	z-index: 100;
	transition: scale 0.2s ease-out;
	display: inline-block;

	&.increasing {
		scale: 1.2;
	}

	&.decreasing {
		scale: 0.9;
	}
}

.balance-inner {
	display: inline-block;
	transition: transform 0.2s ease-out, color 0.2s ease-out;

	&.increasing {
		color: green;
		animation: rotate-shake 0.25s ease-in-out infinite;
	}

	&.decreasing {
		color: red;
	}
}

@keyframes rotate-shake {
	0% {
		transform: rotate(0deg);
	}

	25% {
		transform: rotate(5deg);
	}

	50% {
		transform: rotate(-5deg);
	}

	75% {
		transform: rotate(5deg);
	}

	100% {
		transform: rotate(0deg);
	}
}
</style>
