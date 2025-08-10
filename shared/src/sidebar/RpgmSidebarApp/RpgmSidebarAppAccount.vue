<script setup lang="ts">
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from "reka-ui";

const onResize = inject<(forceCenter?: boolean) => void>('onResize')!;

const session = rpgm.auth.useSession();
const tabValue = ref("login");
const name = ref("");
const email = ref("");
const password = ref("");
const username = ref("");

const welcome = computed(() => {
	if (!session.value.data) return "Welcome";
	const name = session.value.data.user.displayUsername || session.value.data.user.username || session.value.data.user.name;
	return session.value.data ? `Welcome back, ${name}` : "Welcome";
});

function login() {
	rpgm.auth.signIn.username({
		username: username.value,
		password: password.value
	}, {
		onSuccess(ctx) {
			rpgm.logger.log("Login", ctx);
		}
	});
}

watch(tabValue, () => onResize(true));

function signUp() {
	rpgm.auth.signUp.email({
		name: username.value,
		email: email.value,
		password: password.value,
		username: username.value,
		callbackURL: "https://rpgm.tools"
	});
	tabValue.value = "login";
}

function anonymousLogin() {
	rpgm.auth.signIn.anonymous();
}

function logout() {
	rpgm.auth.signOut();
}
</script>

<template>
	<div>
		<Transition name="rpgm-fade">
			<p v-if="session.isPending">Loading</p>
			<div v-else-if="session.data?.user">
				<h2 style="word-break: break-all;">{{ welcome }}</h2>
				<pre>{{ JSON.stringify(session.data, null, 2) }}</pre>

				<button v-if="!session.data?.user.isAnonymous" @click.prevent="logout">
					<i class="fas fa-door" />
					Log Out
				</button>
			</div>
			<div v-else style="background: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 4px;">
				<TabsRoot v-model="tabValue">
					<TabsList
						style="display: flex; position: relative; padding-top: 8px; overflow: hidden; border-radius: 8px 8px 0 0;">
						<TabsTrigger style="flex-grow: 1; text-align: center;" class="tabs-trigger" as="div" value="login">
							<h3 style="border: none;">Login</h3>
						</TabsTrigger>
						<TabsTrigger style="flex-grow: 1; text-align: center; padding-bottom: 4px;" class="tabs-trigger" as="div"
							value="signup">
							<h3 style="border: none;">Sign Up</h3>
						</TabsTrigger>
						<TabsIndicator
							style="position: absolute; bottom: 0;  height: 2px; width: var(--reka-tabs-indicator-size); transform: translateX(var(--reka-tabs-indicator-position)); transition: transform 0.2s ease-in-out">
							<div style="width: 100%; height: 100%; background: #6633cc;" />
						</TabsIndicator>
					</TabsList>
					<div style="position: relative;">
						<Transition name="rpgm-fade">
							<TabsContent v-if="tabValue === 'login'" :force-mount="true" value="login" style="width: 100%;"
								@submit.prevent="login">
								<form style="padding: 2px; display: flex; flex-direction: column; gap: 8px;">
									<div class="form-group">
										<label>Username</label>
										<div class="form-fields">
											<input v-model="username" type="text">
										</div>
									</div>
									<div class="form-group">
										<label>Password</label>
										<div class="form-fields">
											<input v-model="password" class="rpgm-input" placeholder="↑ ↑ ↓ ↓ ← → ← → B A ⏎" type="password">
										</div>
									</div>
									<button type="submit">Login</button>
									<button @click.prevent="anonymousLogin">Sign In Anonymously</button>
								</form>
							</TabsContent>
							<TabsContent v-else-if="tabValue === 'signup'" :force-mount="true" value="signup" style="width: 100%;">
								<form style="padding: 2px; display: flex; flex-direction: column; gap: 8px;" @submit.prevent="signUp">
									<div class="form-group">
										<label>Name</label>
										<div class="form-fields">
											<input v-model="name" type="text">
										</div>
									</div>
									<div class="form-group">
										<label>Email</label>
										<div class="form-fields">
											<input v-model="email" type="text">
										</div>
									</div>
									<div class="form-group">
										<label>Username</label>
										<div class="form-fields">
											<input v-model="username" type="text">
										</div>
									</div>
									<div class="form-group">
										<label>Password</label>
										<div class="form-fields">
											<input v-model="password" type="password">
										</div>
									</div>
									<button type="submit">Sign Up</button>
								</form>
							</TabsContent>
						</Transition>
					</div>
				</TabsRoot>
			</div>
		</Transition>
	</div>
</template>
<style scoped>
.tabs-trigger[data-state="inactive"] {
	cursor: pointer;
}
</style>
