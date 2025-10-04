<!--
	SignIn.vue
	Handles RPGM account sign in/up and inline password reset panel from the Forge sidebar.
	Last updated: 2025-10-04
-->
<script setup lang="ts">
import type { FormRules } from 'naive-ui';

import { useResize } from '#/sidebar';
import { useLoading } from '#/util/useLoading';
import { vFocus } from '#/util/vFocus';

const tabValue = ref<'signin' | 'signup'>('signin');
const onResize = useResize();

// const accountForm = useTemplateRef('accountForm');

const formValue = ref({
	name: '',
	email: '',
	username: '',
	password: ''
});

const signInRules: FormRules = {
	username: {
		required: true,
		message: 'Please enter your username.',
		trigger: 'blur'
	},
	password: {
		required: true,
		message: 'Please enter your password.',
		trigger: 'blur'
	}
};

const signUpRules: FormRules = {
	name: {
		required: true,
		level: 'warning',
		message: 'Please enter a name.',
		trigger: 'blur'
	},
	email: {
		required: true,
		message: 'Please enter an email.',
		trigger: 'blur'
	},
	username: {
		required: true,
		message: 'Please enter a username.',
		trigger: 'blur'
	},
	password: {
		required: true,
		message: 'Please enter a password.',
		trigger: 'blur'
	}
};

watch(tabValue, () => {
	onResize(true);
	forgotOpen.value = false;
});

function submit() {
	if (tabValue.value === 'signin') {
		signIn();
	} else {
		signUp();
	}
}

function signUp() {
	rpgm.auth.signUp.email(
		{
			name: formValue.value.name,
			email: formValue.value.email,
			password: formValue.value.password,
			username: formValue.value.username,
			callbackURL: 'https://rpgm.tools'
		},
		{
			onSuccess() {
				rpgm.logger.visible.log(
					'Check your email for a confirmation link. You may need to check your spam folder.'
				);
			}
		}
	);
	tabValue.value = 'signin';
}

const { start, loading: signInLoading } = useLoading();

function signIn() {
	if (!formValue.value.username || !formValue.value.password) {
		rpgm.logger.visible.warn('Please enter a username and password.');
		return;
	}
	start(
		rpgm.auth.signIn.username({
			username: formValue.value.username,
			password: formValue.value.password
		})
	);
}

const forgotOpen = ref(false);
const forgotEmail = ref('');
const forgotLoading = ref(false);
const forgotError = ref('');
const forgotSuccess = ref('');

const resetEndpoint = new URL(
	'/api/auth/request-password-reset',
	__API_URL__
).toString();
const resetRedirectUrl = new URL('/reset-password', __API_URL__).toString();

watch(forgotOpen, (open) => {
	// Prefill with known email and clear state whenever the panel toggles.
	if (open) {
		forgotEmail.value = formValue.value.email || '';
		forgotError.value = '';
		forgotSuccess.value = '';
	} else {
		forgotLoading.value = false;
		forgotEmail.value = '';
	}
});

function toggleForgotPassword() {
	if (forgotLoading.value) return;
	forgotOpen.value = !forgotOpen.value;
}

function closeForgotPassword() {
	if (forgotLoading.value) return;
	forgotOpen.value = false;
}

async function requestPasswordReset() {
	const email = forgotEmail.value.trim().toLowerCase();
	forgotError.value = '';
	forgotSuccess.value = '';

	if (!email) {
		forgotError.value = 'Enter the email address associated with your account.';
		return;
	}

	forgotLoading.value = true;

	try {
		const response = await fetch(resetEndpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ email, redirectTo: resetRedirectUrl })
		});

		let payload: { message?: string; error?: string } | null = null;

		try {
			payload = await response.json();
		} catch {
			payload = null;
		}

		if (!response.ok) {
			const message =
				payload?.message?.trim() ||
				payload?.error?.trim() ||
				`Unable to send reset email (status ${response.status}).`;
			throw new Error(message);
		}

		const message =
			payload?.message?.trim() ||
			'If that email exists, a reset link is on the way.';
		forgotSuccess.value = message;
		rpgm.logger.visible.log(message);

		setTimeout(() => {
			forgotOpen.value = false;
		}, 1600);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unable to send reset email.';
		forgotError.value = message;
		rpgm.logger.visible.warn(message);
	} finally {
		forgotLoading.value = false;
	}
}
</script>

<template>
	<div>
		<NTabs
			v-model:value="tabValue"
			justify-content="space-evenly"
			animated
			type="segment"
			style="margin-bottom: 8px"
		>
			<NTab
				name="signin"
				tab="Login"
			/>
			<NTab
				name="signup"
				tab="Sign Up"
			/>
		</NTabs>
		<NForm
			ref="accountForm"
			:rules="tabValue === 'signin' ? signInRules : signUpRules"
			:model="formValue"
			@submit.prevent="submit"
		>
			<NCollapseTransition :show="tabValue === 'signup'">
				<NFormItemRow
					label="Name"
					:show-require-mark="false"
					path="name"
				>
					<NInput v-model:value="formValue.name" />
				</NFormItemRow>
				<NFormItemRow
					label="Email"
					path="email"
				>
					<NInput v-model:value="formValue.email" />
				</NFormItemRow>
			</NCollapseTransition>
			<NFormItemRow
				label="Username"
				path="username"
			>
				<NInput
					v-model:value="formValue.username"
					v-focus="'input'"
				/>
			</NFormItemRow>
			<NFormItemRow
				label="Password"
				path="password"
			>
				<NInput
					v-model:value="formValue.password"
					placeholder="↑ ↑ ↓ ↓ ← → ← → B A ⏎"
					type="password"
				/>
			</NFormItemRow>
			<NButton
				type="primary"
				:loading="signInLoading"
				style="width: 100%"
				attr-type="submit"
			>
				{{ tabValue === "signin" ? "Login" : "Sign Up" }}
			</NButton>
			<div class="actions-row">
				<NButton
					text
					type="primary"
					class="forgot-link"
					@click="toggleForgotPassword"
				>
					Forgot password?
				</NButton>
			</div>
			<NCollapseTransition :show="forgotOpen">
				<div class="forgot-panel">
					<h3>Reset password</h3>
					<p>
						Enter the email tied to your RPGM Tools account. If it exists, we
						will email you a reset link.
					</p>
					<NForm @submit.prevent>
						<NFormItemRow label="Email address">
							<NInput
								v-model:value="forgotEmail"
								:disabled="forgotLoading"
								type="text"
								:input-props="{ inputmode: 'email' }"
								placeholder="name@example.com"
							/>
						</NFormItemRow>
					</NForm>
					<NAlert
						v-if="forgotError"
						type="error"
						:show-icon="false"
						class="forgot-alert"
					>
						{{ forgotError }}
					</NAlert>
					<NAlert
						v-else-if="forgotSuccess"
						type="success"
						:show-icon="false"
						class="forgot-alert"
					>
						{{ forgotSuccess }}
					</NAlert>
					<div class="panel-actions">
						<NButton
							quaternary
							:disabled="forgotLoading"
							@click="closeForgotPassword"
						>
							Cancel
						</NButton>
						<NButton
							type="primary"
							:loading="forgotLoading"
							@click="requestPasswordReset"
						>
							Send reset link
						</NButton>
					</div>
				</div>
			</NCollapseTransition>
		</NForm>
	</div>
</template>

<style scoped>
input {
	color: white;
}

.tabs-trigger[data-state="inactive"] {
	cursor: pointer;
}

.actions-row {
	margin-top: 8px;
	display: flex;
	justify-content: flex-end;
}

.forgot-link {
	padding: 0;
	font-size: 0.875rem;
}

.forgot-panel {
	margin-top: 12px;
	padding: 16px;
	border-radius: 16px;
	background: rgba(20, 21, 34, 0.9);
	color: #fff;
}

.forgot-panel h3 {
	margin: 0 0 8px;
	font-size: 1.1rem;
	font-weight: 600;
}

.forgot-panel p {
	margin: 0 0 16px;
	color: #d7d9e7;
	font-size: 0.95rem;
}

.forgot-alert {
	margin-top: 8px;
}

.panel-actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 16px;
}
</style>
