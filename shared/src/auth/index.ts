import { polarClient } from "@polar-sh/better-auth";
import { anonymousClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";

export const auth = createAuthClient({
	baseURL: __API_URL__,
	basePath: "auth",
	fetchOptions: {
		onError: (ctx) => {
			rpgm.logger.visible.error(ctx.error.message);
		}
	},
	disableDefaultFetchPlugins: true,
	plugins: [
		polarClient(),
		usernameClient(),
		anonymousClient(),
	],
});
