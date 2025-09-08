import { polarClient } from '@polar-sh/better-auth';
import { inferAdditionalFields, usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/vue';

export const auth = createAuthClient({
	baseURL: __API_URL__,
	fetchOptions: {
		onSuccess(ctx) {
			const didSignOut = (ctx.request.url instanceof URL
				? ctx.request.url.pathname
				: ctx.request.url).includes('sign-out');

			if (didSignOut) {
				rpgm.authToken = null;
				localStorage.removeItem('rpgm-token');
				return;
			}

			const authToken = ctx.response.headers.get('set-auth-token');
			if (authToken) {
				rpgm.authToken = authToken;
				localStorage.setItem('rpgm-token', authToken);
			}
		},
		onError: (ctx) => {
			if (ctx.error.message)
				rpgm.logger.visible.error(ctx.error.message);
		}
	},
	disableDefaultFetchPlugins: true,
	plugins: [
		inferAdditionalFields({
			user: {
				legacy: {
					type: 'boolean',
					input: false
				},
				polyhedrium: {
					type: 'number',
					input: false
				}
			}
		}),
		polarClient(),
		usernameClient()
	]
});
