<script setup lang="ts">
import axios from 'axios';
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from "reka-ui";

import { useSetting } from '#/util';

const emits = defineEmits<{
	login: []
}>();
const xsollaToken = useSetting("rpgm-tools.login-token");

const email = ref("");
const password = ref("");
const username = ref("");
const discordLoginActive = ref(false);
const discordToken = ref("");

const tabValue = ref("login");

function discordLogin() {
	if (discordLoginActive.value) {
		xsollaToken.value = discordToken.value;
		xsollaToken.save();
		discordLoginActive.value = false;
		emits("login");
	} else {
		void axios.get("https://api.rpgm.tools/discord-signup?source=foundry")
			.then(res => {
				window.open(res.data.url as string, "_blank");
				discordLoginActive.value = true;
			});
	}
}

function login() {
	void axios.post("https://api.rpgm.tools/login", {
		username: username.value,
		password: password.value
	}).then(res => {
		xsollaToken.value = res.data.token;
		xsollaToken.save();
		emits("login");
	});
}

function signUp() {
	void axios.post("https://api.rpgm.tools/signup", {
		email: email.value,
		username: username.value,
		password: password.value,
		accept_consent: true,
	}).then(res => {
		if (res.status == 200) {
			rpgm.logger.visible.log("Successfully signed up! Check your email for a confirmation link. Then you can log in.");
			tabValue.value = "login";
		}
	});
}
</script>

<template>
	<TabsRoot v-model="tabValue">
		<TabsList
			style="display: flex; position: relative; margin-bottom: 8px; padding-top: 8px; overflow: hidden; border-radius: 8px 8px 0 0; background: rgba(0, 0, 0, 0.2);">
			<TabsTrigger style="flex-grow: 1; text-align: center;" as="div" value="login">
				<h3 style="border: none;">Login</h3>
			</TabsTrigger>
			<TabsTrigger style="flex-grow: 1; text-align: center; padding-bottom: 4px;" as="div" value="signup">
				<h3 style="border: none;">Sign Up</h3>
			</TabsTrigger>
			<TabsIndicator
				style="position: absolute; bottom: 0;  height: 2px; width: var(--reka-tabs-indicator-size); transform: translateX(var(--reka-tabs-indicator-position)); transition: transform 0.2s ease-in-out">
				<div style="width: 100%; height: 100%; background: #6633cc;" />
			</TabsIndicator>
		</TabsList>
		<div style="position: relative;">
			<Transition name="fade">
				<TabsContent v-if="tabValue === 'login'" :force-mount="true" value="login" style="width: 100%;">
					<div style="padding: 2px; display: flex; flex-direction: column; gap: 8px;">
						<div class="form-group">
							<label>Username/Email</label>
							<div class="form-fields">
								<input v-model="username" type="text">
							</div>
						</div>
						<div class="form-group">
							<label>Password</label>
							<div class="form-fields">
								<input v-model="password" placeholder="↑ ↑ ↓ ↓ ← → ← → B A ⏎" type="password">
							</div>
						</div>
						<button @click.prevent="login">Login</button>
						<button @click.prevent="discordLogin"><i class="fa-brands fa-discord" />Login with Discord</button>
					</div>
				</TabsContent>
				<TabsContent v-else-if="tabValue === 'signup'" :force-mount="true" value="signup" style="width: 100%;">
					<div style="padding: 2px; display: flex; flex-direction: column; gap: 8px;">
						<div class="form-group">
							<label>Email</label>
							<div class="form-fields">
								<input v-model="email" type="text">
							</div>
						</div>
						<div class="form-group">
							<label>Password</label>
							<div class="form-fields">
								<input v-model="password" type="password">
							</div>
						</div>
						<div class="form-group">
							<label>Username</label>
							<div class="form-fields">
								<input v-model="username" type="text">
							</div>
						</div>
						<button @click.prevent="signUp">Sign Up</button>
						<button @click.prevent="discordLogin"><i class="fa-brands fa-discord" />Sign up with Discord</button>
					</div>
				</TabsContent>
			</Transition>
			<div v-if="discordLoginActive">
				<textarea v-model="discordToken" />
				<button @click.prevent="discordLogin">Login with Discord</button>
			</div>
		</div>
	</TabsRoot>
</template>
