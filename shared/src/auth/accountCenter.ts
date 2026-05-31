/**
 * File: accountCenter.ts
 * Purpose: Build Foundry-friendly links into the shared RPGM Tools account center.
 * Notes: Keep this helper aligned with the shared account-center contract in `rpgm-tools/rpgm`.
 */

export const FOUNDRY_ACCOUNT_CENTER_PATHNAME = '/settings/';
export const FOUNDRY_ACCOUNT_CENTER_TAB_HASH = 'account';
export const FOUNDRY_ACCOUNT_CENTER_SOURCE = 'foundry';
const DEFAULT_PUBLIC_ACCOUNT_CENTER_BASE_URL = 'https://rpgm.tools';

export const DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL = isAbsoluteUrl(
	__RPGM_ACCOUNT_WEB_BASE_URL__
)
	? __RPGM_ACCOUNT_WEB_BASE_URL__
	: DEFAULT_PUBLIC_ACCOUNT_CENTER_BASE_URL;

export const DEFAULT_FOUNDRY_ACCOUNT_CENTER_ORIGIN = new URL(
	DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
).origin;

export type FoundryAccountCenterFocus =
	| 'session'
	| 'connections'
	| 'passkeys'
	| 'password'
	| 'forge';

export type FoundryAccountCenterProviderId =
	| 'google'
	| 'github'
	| 'patreon'
	| 'discord'
	| 'microsoft-entra-id';

export type FoundryAccountCenterProviderMode = 'link' | 'sign-in';

export function createFoundryAccountCenterUrl(input: {
	baseUrl: string | URL;
	focus?: FoundryAccountCenterFocus | null;
	redirectUrl?: string | null;
	provider?: FoundryAccountCenterProviderId | null;
	mode?: FoundryAccountCenterProviderMode | null;
}): string {
	const accountCenterUrl = new URL(
		FOUNDRY_ACCOUNT_CENTER_PATHNAME,
		input.baseUrl
	);

	accountCenterUrl.hash = FOUNDRY_ACCOUNT_CENTER_TAB_HASH;
	accountCenterUrl.searchParams.set('source', FOUNDRY_ACCOUNT_CENTER_SOURCE);

	if (input.focus) {
		accountCenterUrl.searchParams.set('focus', input.focus);
	}

	if (input.redirectUrl && isAbsoluteUrl(input.redirectUrl)) {
		accountCenterUrl.searchParams.set('redirectUrl', input.redirectUrl);
	}

	if (input.provider) {
		accountCenterUrl.searchParams.set('provider', input.provider);
	}

	if (input.mode) {
		accountCenterUrl.searchParams.set('mode', input.mode);
	}

	return accountCenterUrl.toString();
}

export function createFoundryAccountCenterHostLabel(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): string {
	return new URL(baseUrl).host;
}

export function isAbsoluteUrl(value: string): boolean {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}
