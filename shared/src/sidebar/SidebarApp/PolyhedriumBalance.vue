<script setup lang="ts">
import type { Property } from 'csstype';

import AnimatedNumber from '#/util/AnimatedNumber';
import SignedIn from '#/util/SignedIn.vue';

const { balance, updateBalance } = rpgm.usePolyhedriumBalance();

const { align = 'center center' } = defineProps<{
	align?: Property.TransformOrigin
}>();
</script>

<template>
	<SignedIn>
		<AnimatedNumber
			:value="balance"
			#="{ display, direction }"
			:duration="3000"
		>
			<NPopover
				placement="left"
			>
				<span>{{ balance }} Polyhedrium</span>
				<template #trigger>
					<NTag
						:type="direction === 0 ? 'info' : direction > 0 ? 'success' : 'error'"
						@click="updateBalance"
					>
						<template
							#icon
						>
							<NIcon size="medium">
								<i class="fa-solid fa-dice-d12" />
							</NIcon>
						</template>
						<span
							class="balance-outer"
							:style="{ transformOrigin: align }"
							:class="{ increasing: direction > 0, decreasing: direction < 0 }"
						>
							{{ display }}
						</span>
					</NTag>
				</template>
			</NPopover>
		</AnimatedNumber>
	</SignedIn>
</template>

<style scoped>
.balance-outer {
	z-index: 100;
	transition: all 0.2s ease-out;
	display: inline-block;

	&.increasing {
		scale: 1.2;
		animation: rotate-shake 0.25s ease-in-out infinite;
	}

	&.decreasing {
		scale: 0.9;
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
