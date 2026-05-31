/**
 * File: auth/index.ts
 * Purpose: Preserve the tiny legacy `rpgm.auth` surface that old Forge still exposes.
 * Notes: Track 1 bridge auth now belongs to the hosted Steward account center, so the
 * legacy Better Auth browser client is intentionally retired here instead of continuing
 * to bootstrap a stale auth runtime inside the Foundry shell.
 */

interface LegacyFoundryAuthResult<TData> {
	data: TData;
	error: null;
}

interface LegacyFoundryAuthClient {
	listAccounts(): Promise<LegacyFoundryAuthResult<[]>>;
	getSession(): Promise<LegacyFoundryAuthResult<null>>;
	signOut(): Promise<LegacyFoundryAuthResult<{ success: true }>>;
}

function createLegacyAuthResult<TData>(
	data: TData
): LegacyFoundryAuthResult<TData> {
	return {
		data,
		error: null
	};
}

function clearLegacyAuthToken() {
	rpgm.authToken = null;

	try {
		localStorage.removeItem('rpgm-token');
	} catch {
		return;
	}
}

export const auth: LegacyFoundryAuthClient = {
	async listAccounts() {
		return createLegacyAuthResult([] as []);
	},
	async getSession() {
		return createLegacyAuthResult(null);
	},
	async signOut() {
		clearLegacyAuthToken();
		return createLegacyAuthResult({ success: true as const });
	}
};
