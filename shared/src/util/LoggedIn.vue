<script setup lang="ts">
const loggedIn = rpgm.auth.useSession();
</script>

<template>
	<slot v-if="loggedIn.data?.session" />
	<slot v-else name="not-logged-in" />
</template>
