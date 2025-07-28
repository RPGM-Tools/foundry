<script setup lang="ts">

const isLoggedIn = Boolean(rpgm.loginToken);
</script>

<template>
	<slot v-if="isLoggedIn" />
	<slot v-else name="not-logged-in" />
</template>
