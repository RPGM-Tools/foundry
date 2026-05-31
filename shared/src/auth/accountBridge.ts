/**
 * File: accountBridge.ts
 * Purpose: Manage Foundry-side RPGM Tools account snapshots and account-backed Forge usage reads.
 * Notes: Keeps the legacy Foundry bridge on the same snapshot-token lane as the shared account center and Steward-backed Forge usage endpoints.
 */

import { createGlobalState } from '@vueuse/core';

import { createFoundryAccountCenterUrl } from './accountCenter';

const DEFAULT_PUBLIC_WEB_BASE_URL = 'https://rpgm.tools';
const ACCOUNT_PROFILE_PATHNAME = '/api/v1/account/profile';
const ACCOUNT_SESSION_TOKEN_PATHNAME = '/api/v1/account/profile-snapshot-token';
export const ACCOUNT_SESSION_TOKEN_HEADER_NAME =
	'x-rpgm-account-session-token';
export const FOUNDRY_PROFILE_SNAPSHOT_TOKEN_STORAGE_KEY =
	'rpgm.foundry.profileSnapshotToken';
const RETURN_REFRESH_POLL_INTERVAL_MS = 1500;
const RETURN_REFRESH_POLL_TIMEOUT_MS = 45000;
const ACCOUNT_PROFILE_QUERY_PARAMS = {
	expand: 'expand'
} as const;
const ACCOUNT_SESSION_TOKEN_QUERY_PARAMS = {
	accountSessionToken: 'accountSessionToken',
	foundryProfileSnapshotToken: 'foundryProfileSnapshotToken',
	redirectUrl: 'redirectUrl',
	accountSessionError: 'accountSessionError',
	accountSessionErrorDescription: 'accountSessionErrorDescription'
} as const;
const ACCOUNT_PROFILE_EXPANSIONS = [
	'membership',
	'entitlements',
	'usage-readiness',
	'economy'
] as const;

interface FoundryAccountBridgeNotice {
	kind: 'info' | 'warning';
	message: string;
}

export interface FoundryAccountBridgeSnapshot {
	status: 'available' | 'signed-out' | 'unavailable';
	sourceSummary: string;
	displayName: string;
	profileSummary: string;
	visibilitySummary: string;
	membershipSummary: string;
	usageReadinessSummary: string;
	economySummary: string;
}

export interface FoundryAccountBackedForgeUsageSnapshot {
	used: number;
	limit: number | null;
	remaining: number | null;
	overLimit: boolean;
}

function normalizeOptionalText(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null;
	}

	const normalizedValue = value.trim();

	return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeFiniteNumber(value: unknown): number | null {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return null;
	}

	return value;
}

function summarizePreviewText(value: unknown, fallback: string): string {
	const normalizedValue = normalizeOptionalText(value);

	if (!normalizedValue) {
		return fallback;
	}

	return normalizedValue.length <= 120
		? normalizedValue
		: `${normalizedValue.slice(0, 117)}...`;
}

function countVisibleProfileSections(sections: unknown): number {
	if (!Array.isArray(sections)) {
		return 0;
	}

	return sections.filter(section => {
		return Boolean((section as { visible?: boolean }).visible);
	}).length;
}

function createSignedOutSnapshot(): FoundryAccountBridgeSnapshot {
	return {
		status: 'signed-out',
		sourceSummary:
			'No RPGM Tools account is connected in this Foundry session.',
		displayName: 'Open your RPGM Tools account to sign in or create one.',
		profileSummary: 'Profile changes stay on rpgm.tools.',
		visibilitySummary:
			'Profile visibility will appear after the account loads.',
		membershipSummary: 'No membership is loaded yet.',
		usageReadinessSummary: 'No managed usage is loaded yet.',
		economySummary: 'No Ore balance is loaded yet.'
	};
}

function createUnavailableSnapshot(
	details?: string | null
): FoundryAccountBridgeSnapshot {
	return {
		status: 'unavailable',
		sourceSummary: details
			? `Could not refresh the current account summary: ${details}`
			: 'Could not refresh the current account summary just now.',
		displayName:
			'Open your RPGM Tools account in the browser when you need to manage sign-in or providers.',
		profileSummary: 'Profile changes stay on rpgm.tools.',
		visibilitySummary:
			'Profile visibility is unavailable until the next successful refresh.',
		membershipSummary:
			'Membership is unavailable until the next successful refresh.',
		usageReadinessSummary:
			'Managed usage is unavailable until the next successful refresh.',
		economySummary:
			'Ore balance is unavailable until the next successful refresh.'
	};
}

function createProfileSummary(profile: unknown): string {
	const identity = (
		profile as {
			identity?: {
				tagline?: string | null;
				biography?: string | null;
			};
		}
	).identity;
	const tagline = normalizeOptionalText(identity?.tagline);
	const biography = normalizeOptionalText(identity?.biography);

	if (tagline) {
		return summarizePreviewText(tagline, 'No profile text is visible yet.');
	}

	if (biography) {
		return summarizePreviewText(
			biography,
			'No profile text is visible yet.'
		);
	}

	return 'No tagline or biography is visible from Steward yet.';
}

function createVisibilitySummary(profile: unknown): string {
	const typedProfile = profile as {
		visibility?: {
			defaultVisibility?: string | null;
		};
		publicPreview?: {
			sections?: Array<{ visible?: boolean }>;
		};
	};
	const defaultVisibility =
		normalizeOptionalText(typedProfile.visibility?.defaultVisibility) ??
		'private';
	const visibleSectionCount = countVisibleProfileSections(
		typedProfile.publicPreview?.sections
	);

	if (!visibleSectionCount) {
		return `Default visibility is ${defaultVisibility}; no public sections are visible yet.`;
	}

	return `Default visibility is ${defaultVisibility}; ${visibleSectionCount} public section${visibleSectionCount === 1 ? '' : 's'} are currently visible.`;
}

function createMembershipSummary(privateExpansions: unknown): string {
	const typedExpansions = privateExpansions as {
		membership?: {
			activeTierName?: string | null;
			membershipStatus?: string | null;
		};
		entitlements?: {
			tierName?: string | null;
		};
	};
	const activeTierName =
		normalizeOptionalText(typedExpansions.membership?.activeTierName) ??
		normalizeOptionalText(typedExpansions.entitlements?.tierName);
	const membershipStatus = normalizeOptionalText(
		typedExpansions.membership?.membershipStatus
	);

	if (activeTierName && membershipStatus) {
		return `Active tier: ${activeTierName} (${membershipStatus}).`;
	}

	if (activeTierName) {
		return `Active tier: ${activeTierName}.`;
	}

	if (membershipStatus) {
		return `Membership status: ${membershipStatus}.`;
	}

	return 'No active membership summary is visible yet.';
}

function createUsageReadinessSummary(privateExpansions: unknown): string {
	const snapshot = (
		privateExpansions as {
			usageReadiness?: {
				snapshot?: {
					remaining?: number | null;
					limit?: number | null;
					overLimit?: boolean | null;
				};
			};
		}
	).usageReadiness?.snapshot;
	const remaining = normalizeFiniteNumber(snapshot?.remaining);
	const limit = normalizeFiniteNumber(snapshot?.limit);

	if (snapshot?.overLimit) {
		return 'Managed Forge usage is currently beyond the visible allowance.';
	}

	if (remaining !== null && limit !== null) {
		return `${remaining} of ${limit} managed runs remain in the current visible allowance.`;
	}

	return 'No managed Forge usage summary is visible yet.';
}

function createEconomySummary(privateExpansions: unknown): string {
	const oreBalance = (
		privateExpansions as {
			economy?: {
				oreBalance?: {
					spendableBalance?: number | null;
					lifetimeBalance?: number | null;
				};
			};
		}
	).economy?.oreBalance;
	const spendableBalance = normalizeFiniteNumber(
		oreBalance?.spendableBalance
	);
	const lifetimeBalance = normalizeFiniteNumber(oreBalance?.lifetimeBalance);

	if (spendableBalance !== null) {
		return `${spendableBalance} Ore is currently spendable from this account.`;
	}

	if (lifetimeBalance !== null) {
		return `${lifetimeBalance} lifetime Ore has been recorded for this account.`;
	}

	return 'No Ore balance summary is visible yet.';
}

function createAvailableSnapshot(
	payload: unknown
): FoundryAccountBridgeSnapshot {
	const typedPayload = payload as {
		profile?: unknown;
		privateExpansions?: unknown;
	};
	const profile = typedPayload.profile;
	const privateExpansions = typedPayload.privateExpansions;
	const displayName = normalizeOptionalText(
		(
			profile as {
				identity?: {
					displayName?: string | null;
				};
			}
		).identity?.displayName
	);

	return {
		status: 'available',
		sourceSummary: 'Connected to your RPGM Tools account.',
		displayName: displayName ?? 'No display name is visible yet.',
		profileSummary: createProfileSummary(profile),
		visibilitySummary: createVisibilitySummary(profile),
		membershipSummary: createMembershipSummary(privateExpansions),
		usageReadinessSummary: createUsageReadinessSummary(privateExpansions),
		economySummary: createEconomySummary(privateExpansions)
	};
}

function readCurrentLocationUrl(): URL | null {
	if (typeof globalThis.location?.href !== 'string') {
		return null;
	}

	try {
		return new URL(globalThis.location.href);
	} catch {
		return null;
	}
}

function readStoredSnapshotToken(): string | null {
	try {
		return normalizeOptionalText(
			globalThis.localStorage?.getItem(
				FOUNDRY_PROFILE_SNAPSHOT_TOKEN_STORAGE_KEY
			)
		);
	} catch {
		return null;
	}
}

export function readStoredFoundryAccountSessionToken(): string | null {
	return readStoredSnapshotToken();
}

function writeStoredSnapshotToken(token: string | null) {
	try {
		if (token) {
			globalThis.localStorage?.setItem(
				FOUNDRY_PROFILE_SNAPSHOT_TOKEN_STORAGE_KEY,
				token
			);
			return;
		}

		globalThis.localStorage?.removeItem(
			FOUNDRY_PROFILE_SNAPSHOT_TOKEN_STORAGE_KEY
		);
	} catch {
		return;
	}
}

export function clearStoredFoundryAccountSessionToken() {
	writeStoredSnapshotToken(null);
}

function normalizeAccountBackedForgeUsageSnapshot(
	payload: unknown
): FoundryAccountBackedForgeUsageSnapshot | null {
	const typedPayload = payload as {
		used?: unknown;
		limit?: unknown;
		remaining?: unknown;
		overLimit?: unknown;
	};
	const used = normalizeFiniteNumber(typedPayload?.used);
	const overLimit =
		typeof typedPayload?.overLimit === 'boolean'
			? typedPayload.overLimit
			: null;

	if (used === null || overLimit === null) {
		return null;
	}

	return {
		used,
		limit: normalizeFiniteNumber(typedPayload.limit),
		remaining: normalizeFiniteNumber(typedPayload.remaining),
		overLimit
	};
}

export async function loadAccountBackedForgeUsageSnapshot(
	baseUrl: string | URL = DEFAULT_PUBLIC_WEB_BASE_URL
): Promise<FoundryAccountBackedForgeUsageSnapshot | null> {
	const fetchImplementation =
		typeof globalThis.fetch === 'function'
			? globalThis.fetch.bind(globalThis)
			: null;

	if (!fetchImplementation) {
		return null;
	}

	const accountSessionToken = readStoredSnapshotToken();
	const requestHeaders = new Headers({
		accept: 'application/json'
	});

	if (accountSessionToken) {
		requestHeaders.set(
			ACCOUNT_SESSION_TOKEN_HEADER_NAME,
			accountSessionToken
		);
	}

	try {
		const response = await fetchImplementation(
			new URL('/api/v1/forge/usage', baseUrl).toString(),
			{
				method: 'GET',
				headers: requestHeaders,
				credentials: 'include',
				cache: 'no-store'
			}
		);
		const payload = await response.json().catch(() => null);

		if (response.status === 401) {
			if (accountSessionToken) {
				clearStoredFoundryAccountSessionToken();
			}

			return null;
		}

		if (!response.ok) {
			return null;
		}

		return normalizeAccountBackedForgeUsageSnapshot(payload);
	} catch {
		return null;
	}
}

function consumeBridgeReturnFromUrl(): FoundryAccountBridgeNotice | null {
	const currentUrl = readCurrentLocationUrl();

	if (!currentUrl) {
		return null;
	}

	const accountSessionToken =
		normalizeOptionalText(
			currentUrl.searchParams.get(
				ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionToken
			)
		) ??
		normalizeOptionalText(
			currentUrl.searchParams.get(
				ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.foundryProfileSnapshotToken
			)
		);
	const accountSessionError = normalizeOptionalText(
		currentUrl.searchParams.get(
			ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionError
		)
	);
	const accountSessionErrorDescription = normalizeOptionalText(
		currentUrl.searchParams.get(
			ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionErrorDescription
		)
	);

	if (!accountSessionToken && !accountSessionError) {
		return null;
	}

	if (accountSessionToken) {
		writeStoredSnapshotToken(accountSessionToken);
	}

	currentUrl.searchParams.delete(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionToken
	);
	currentUrl.searchParams.delete(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.foundryProfileSnapshotToken
	);
	currentUrl.searchParams.delete(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionError
	);
	currentUrl.searchParams.delete(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionErrorDescription
	);
	globalThis.history?.replaceState?.(
		globalThis.history.state ?? null,
		'',
		currentUrl.toString()
	);

	if (accountSessionToken) {
		return {
			kind: 'info',
			message:
				'Foundry received a signed-in Steward account snapshot. Refreshing the legacy bridge lane now.'
		};
	}

	return {
		kind: 'warning',
		message:
			accountSessionErrorDescription ??
			`Steward account sync returned ${accountSessionError}.`
	};
}

function createAccountProfileRequestUrl(): string {
	const profileRequestUrl = new URL(
		ACCOUNT_PROFILE_PATHNAME,
		DEFAULT_PUBLIC_WEB_BASE_URL
	);

	for (const expansion of ACCOUNT_PROFILE_EXPANSIONS) {
		profileRequestUrl.searchParams.append(
			ACCOUNT_PROFILE_QUERY_PARAMS.expand,
			expansion
		);
	}

	return profileRequestUrl.toString();
}

export function createFoundryAccountSessionSyncUrl(): string | null {
	const currentUrl = readCurrentLocationUrl();

	if (!currentUrl) {
		return null;
	}

	const accountSessionSyncUrl = new URL(
		ACCOUNT_SESSION_TOKEN_PATHNAME,
		DEFAULT_PUBLIC_WEB_BASE_URL
	);
	accountSessionSyncUrl.searchParams.set(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.redirectUrl,
		currentUrl.toString()
	);

	return accountSessionSyncUrl.toString();
}

async function loadAccountSnapshot(): Promise<FoundryAccountBridgeSnapshot> {
	if (typeof globalThis.fetch !== 'function') {
		return createUnavailableSnapshot(
			'This Foundry runtime does not expose fetch.'
		);
	}

	const requestHeaders = new Headers({
		accept: 'application/json'
	});
	const snapshotToken = readStoredSnapshotToken();

	if (snapshotToken) {
		requestHeaders.set(ACCOUNT_SESSION_TOKEN_HEADER_NAME, snapshotToken);
	}

	try {
		const response = await globalThis.fetch(
			createAccountProfileRequestUrl(),
			{
				method: 'GET',
				credentials: 'include',
				cache: 'no-store',
				headers: requestHeaders
			}
		);
		const payload = await response.json().catch(() => null);

		if (response.status === 401) {
			if (snapshotToken) {
				writeStoredSnapshotToken(null);
			}

			return createSignedOutSnapshot();
		}

		if (!response.ok) {
			const payloadError = (payload as { error?: unknown } | null)?.error;
			const errorMessage = normalizeOptionalText(
				typeof payloadError === 'string'
					? payloadError
					: (payloadError as { message?: unknown } | null)?.message
			);

			return createUnavailableSnapshot(
				errorMessage ?? `HTTP ${response.status}`
			);
		}

		return createAvailableSnapshot(payload);
	} catch (error) {
		return createUnavailableSnapshot(
			error instanceof Error ? error.message : null
		);
	}
}

function openExternalUrl(url: string | null) {
	if (!url) {
		return false;
	}

	globalThis.open?.(url, '_blank', 'noopener,noreferrer');
	return true;
}

export const useFoundryAccountBridge = createGlobalState(() => {
	const snapshot = shallowRef<FoundryAccountBridgeSnapshot>(
		createSignedOutSnapshot()
	);
	const isLoading = ref(false);
	const notice = ref<FoundryAccountBridgeNotice | null>(
		consumeBridgeReturnFromUrl()
	);
	let lastSeenSnapshotToken = readStoredSnapshotToken();
	let expectsRefreshOnReturn = false;
	let returnRefreshPollHandle: ReturnType<
		typeof globalThis.setInterval
	> | null = null;
	let returnRefreshTimeoutHandle: ReturnType<
		typeof globalThis.setTimeout
	> | null = null;

	const clearPendingReturnRefreshWatch = () => {
		if (
			returnRefreshPollHandle !== null &&
			typeof globalThis.clearInterval === 'function'
		) {
			globalThis.clearInterval(returnRefreshPollHandle);
			returnRefreshPollHandle = null;
		}

		if (
			returnRefreshTimeoutHandle !== null &&
			typeof globalThis.clearTimeout === 'function'
		) {
			globalThis.clearTimeout(returnRefreshTimeoutHandle);
			returnRefreshTimeoutHandle = null;
		}
	};

	const stopWatchingForReturn = () => {
		expectsRefreshOnReturn = false;
		clearPendingReturnRefreshWatch();
	};

	const startWatchingForReturn = () => {
		clearPendingReturnRefreshWatch();
		expectsRefreshOnReturn = true;

		if (typeof globalThis.setInterval === 'function') {
			returnRefreshPollHandle = globalThis.setInterval(() => {
				void refreshIfReturnDetected();
			}, RETURN_REFRESH_POLL_INTERVAL_MS);
		}

		if (typeof globalThis.setTimeout === 'function') {
			returnRefreshTimeoutHandle = globalThis.setTimeout(() => {
				stopWatchingForReturn();
			}, RETURN_REFRESH_POLL_TIMEOUT_MS);
		}
	};

	const refresh = async () => {
		const consumedNotice = consumeBridgeReturnFromUrl();

		if (consumedNotice) {
			notice.value = consumedNotice;
		}

		isLoading.value = true;
		try {
			snapshot.value = await loadAccountSnapshot();
			lastSeenSnapshotToken = readStoredSnapshotToken();

			if (snapshot.value.status === 'available') {
				stopWatchingForReturn();
			}
		} finally {
			isLoading.value = false;
		}
	};

	const refreshIfReturnDetected = async () => {
		if (isLoading.value) {
			return;
		}

		const currentSnapshotToken = readStoredSnapshotToken();
		const snapshotTokenChanged =
			currentSnapshotToken !== lastSeenSnapshotToken;

		if (!expectsRefreshOnReturn && !snapshotTokenChanged) {
			return;
		}

		await refresh();
	};

	const trySilentConnectFromActiveBrowserSession = async () => {
		await refresh();

		if (snapshot.value.status !== 'available') {
			return false;
		}

		notice.value = {
			kind: 'info',
			message:
				'Connected your RPGM Tools account from the browser session that is already signed in on rpgm.tools.'
		};

		return true;
	};

	const openAccountCenter = (options: {
		focus: 'session' | 'connections' | 'passkeys' | 'password' | 'forge';
	}) => {
		startWatchingForReturn();
		return openExternalUrl(
			createFoundryAccountCenterUrl({
				baseUrl: DEFAULT_PUBLIC_WEB_BASE_URL,
				focus: options.focus
			})
		);
	};

	const openConnectOrCreateAccount = async () => {
		if (await trySilentConnectFromActiveBrowserSession()) {
			return;
		}

		if (!openAccountCenter({ focus: 'session' })) {
			stopWatchingForReturn();
			notice.value = {
				kind: 'warning',
				message:
					'Foundry could not open the RPGM Tools account handoff just now.'
			};
		}
	};

	const openAccountSettings = () => {
		if (!openAccountCenter({ focus: 'connections' })) {
			stopWatchingForReturn();
			notice.value = {
				kind: 'warning',
				message:
					'Foundry could not open the RPGM Tools account view just now.'
			};
		}
	};

	const disconnectFoundrySession = () => {
		stopWatchingForReturn();
		writeStoredSnapshotToken(null);
		lastSeenSnapshotToken = null;
		snapshot.value = createSignedOutSnapshot();
		notice.value = {
			kind: 'info',
			message:
				'Cleared the local Steward snapshot token for this Foundry lane. Your public web account session is unchanged.'
		};
	};

	const clearNotice = () => {
		notice.value = null;
	};

	globalThis.addEventListener?.('focus', refreshIfReturnDetected);
	globalThis.addEventListener?.('visibilitychange', () => {
		if (globalThis.document?.visibilityState === 'visible') {
			refreshIfReturnDetected();
		}
	});

	void refresh();

	return {
		snapshot,
		isLoading,
		notice,
		isConnected: computed(() => snapshot.value.status === 'available'),
		hasStoredSnapshotToken: computed(() =>
			Boolean(readStoredSnapshotToken())
		),
		refresh,
		clearNotice,
		openConnectOrCreateAccount,
		openAccountSettings,
		disconnectFoundrySession
	};
});
