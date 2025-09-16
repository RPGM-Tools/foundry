<template>
	<RouterLink
		#="{ navigate }"
		to="/account/bring-your-own-ai"
		custom
	>
		<span style="width: 100%; display: inline-flex; justify-content: end;">
			<a
				class="rpgm-link"
				@click="navigate"
			>
				I have my own AI 
				<i class="fas fa-robot" />
			</a>
		</span>
	</RouterLink>
</template>
