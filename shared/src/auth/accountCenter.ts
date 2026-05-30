/**
 * File: accountCenter.ts
 * Purpose: Build Foundry-friendly links into the shared RPGM account center during the Forge 2.x bridge.
 * Notes: Keep this contract aligned with the target-state account-center semantics in `rpgm-tools/rpgm` until Old Forge fully moves onto the shared runtime.
 */

export const FOUNDRY_ACCOUNT_CENTER_PATHNAME = '/settings/';
export const FOUNDRY_ACCOUNT_CENTER_TAB_HASH = 'account';
export const FOUNDRY_ACCOUNT_CENTER_SOURCE = 'foundry';

export type FoundryAccountCenterFocus =
	| 'session'
	| 'connections'
	| 'passkeys'
	| 'password'
	| 'forge';

export function createFoundryAccountCenterUrl(input: {
	baseUrl: string | URL;
	focus: FoundryAccountCenterFocus;
}): string {
	const accountCenterUrl = new URL(
		FOUNDRY_ACCOUNT_CENTER_PATHNAME,
		input.baseUrl
	);

	accountCenterUrl.hash = FOUNDRY_ACCOUNT_CENTER_TAB_HASH;
	accountCenterUrl.searchParams.set('source', FOUNDRY_ACCOUNT_CENTER_SOURCE);
	accountCenterUrl.searchParams.set('focus', input.focus);

	return accountCenterUrl.toString();
}

export function isAbsoluteUrl(value: string): boolean {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}
