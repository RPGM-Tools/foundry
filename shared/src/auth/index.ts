import { polarClient } from '@polar-sh/better-auth';
import { inferAdditionalFields, usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/vue';

export const auth = createAuthClient({
	baseURL: __API_URL__,
	fetchOptions: {
		onError: (ctx) => {
			if (ctx.error.message)
				rpgm.tools.logger.visible.error(ctx.error.message);
		}
	},
	disableDefaultFetchPlugins: true,
	plugins: [
		inferAdditionalFields({
			user: {
				legacy: {
					type: 'boolean',
					input: false,
				},
				polyhedrium: {
					type: 'number',
					input: false
				}
			}
		}),
		polarClient(),
		usernameClient(),
	],
});
