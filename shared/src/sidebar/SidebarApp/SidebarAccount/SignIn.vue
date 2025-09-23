<script setup lang="ts">
import type { FormRules } from 'naive-ui';

import { useResize } from '#/sidebar';
import { useLoading } from '#/util/useLoading';
import { vFocus } from '#/util/vFocus';

const tabValue = ref('signin');
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

watch(tabValue, () => onResize(true));

function submit() {
	if (tabValue.value === 'signin') {
		signIn();
	} else {
		signUp();
	}
}

function signUp() {
	rpgm.auth.signUp.email({
		name: formValue.value.name,
		email: formValue.value.email,
		password: formValue.value.password,
		username: formValue.value.username,
		callbackURL: 'https://rpgm.tools'
	}, {
			onSuccess() {
				rpgm.logger.visible.log('Check your email for a confirmation link. You may need to check your spam folder.');
			}
		});
	tabValue.value = 'signin';
}

const { start, loading: signInLoading } = useLoading();

function signIn() {
	if (!formValue.value.username || !formValue.value.password) {
		rpgm.logger.visible.warn('Please enter a username and password.');
		return;
	};
	start(rpgm.auth.signIn.username({
		username: formValue.value.username,
		password: formValue.value.password
	}));
}
</script>

<template>
	<div>
		<NTabs
			v-model:value="tabValue"
			justify-content="space-evenly"
			animated
			type="segment"
			style="margin-bottom: 8px;"
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
				style="width: 100%;"
				attr-type="submit"
			>
				{{ tabValue === 'signin' ? 'Login' : 'Sign Up' }}
			</NButton>
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
</style>
