import { createGlobalState } from '@vueuse/core';

import { createFoundryAccountCenterUrl } from './accountCenter';

const DEFAULT_PUBLIC_WEB_BASE_URL = 'https://rpgm.tools';
const ACCOUNT_PROFILE_PATHNAME = '/api/v1/account/profile';
const ACCOUNT_SESSION_TOKEN_PATHNAME = '/api/v1/account/profile-snapshot-token';
const ACCOUNT_SESSION_TOKEN_HEADER_NAME = 'x-rpgm-account-session-token';
const FOUNDRY_PROFILE_SNAPSHOT_TOKEN_STORAGE_KEY =
	'rpgm.foundry.profileSnapshotToken';
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
			'No signed-in Steward-backed account snapshot is connected to this old Forge lane yet.',
		displayName:
			'Connect or create your RPGM Tools account on the public web, then sync that signed-in session back into Foundry.',
		profileSummary:
			'Profile editing stays on the public RPGM Tools settings origin for this bridge lane.',
		visibilitySummary:
			'No public profile visibility summary is available in this local Foundry session yet.',
		membershipSummary:
			'No active membership summary is visible in this old Forge lane yet.',
		usageReadinessSummary:
			'No managed Forge usage summary is visible in this old Forge lane yet.',
		economySummary:
			'No Ore snapshot is visible in this old Forge lane yet.'
	};
}

function createUnavailableSnapshot(
	details?: string | null
): FoundryAccountBridgeSnapshot {
	return {
		status: 'unavailable',
		sourceSummary: details
			? `Foundry could not refresh the Steward-backed account snapshot: ${details}`
			: 'Foundry could not refresh the Steward-backed account snapshot just now.',
		displayName:
			'Use the public RPGM Tools settings page when you need the full account and profile surface.',
		profileSummary:
			'Profile editing and account ceremony still live on the public RPGM Tools settings origin.',
		visibilitySummary:
			'Current visibility posture is unavailable until the next successful Steward refresh.',
		membershipSummary:
			'Current membership posture is unavailable until the next successful Steward refresh.',
		usageReadinessSummary:
			'Current Forge usage posture is unavailable until the next successful Steward refresh.',
		economySummary:
			'Current Ore posture is unavailable until the next successful Steward refresh.'
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

function createAvailableSnapshot(payload: unknown): FoundryAccountBridgeSnapshot {
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
		sourceSummary:
			'Steward-backed account snapshot loaded for this legacy Forge bridge lane.',
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
		const response = await globalThis.fetch(createAccountProfileRequestUrl(), {
			method: 'GET',
			credentials: 'include',
			cache: 'no-store',
			headers: requestHeaders
		});
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

	const refresh = async () => {
		const consumedNotice = consumeBridgeReturnFromUrl();

		if (consumedNotice) {
			notice.value = consumedNotice;
		}

		isLoading.value = true;
		try {
			snapshot.value = await loadAccountSnapshot();
			lastSeenSnapshotToken = readStoredSnapshotToken();
		} finally {
			isLoading.value = false;
		}
	};

	const refreshIfSnapshotTokenChanged = () => {
		const currentSnapshotToken = readStoredSnapshotToken();

		if (currentSnapshotToken === lastSeenSnapshotToken) {
			return;
		}

		void refresh();
	};

	const openConnectOrCreateAccount = () => {
		openExternalUrl(
			createFoundryAccountCenterUrl({
				baseUrl: DEFAULT_PUBLIC_WEB_BASE_URL,
				focus: 'session'
			})
		);
	};

	const openAccountSettings = () => {
		openConnectOrCreateAccount();
	};

	const openManagePassword = () => {
		openExternalUrl(
			createFoundryAccountCenterUrl({
				baseUrl: DEFAULT_PUBLIC_WEB_BASE_URL,
				focus: 'password'
			})
		);
	};

	const openSyncSignedInAccount = () => {
		const syncUrl = createFoundryAccountSessionSyncUrl();

		if (!syncUrl) {
			notice.value = {
				kind: 'warning',
				message:
					'Foundry could not build the local Steward sync handoff URL just now.'
			};
			return;
		}

		openExternalUrl(syncUrl);
		notice.value = {
			kind: 'info',
			message:
				'Opened the signed-in Steward sync handoff in a new tab. Finish the web step there, then return to this Foundry tab.'
		};
	};

	const disconnectFoundrySession = () => {
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

	globalThis.addEventListener?.('focus', refreshIfSnapshotTokenChanged);
	globalThis.addEventListener?.('visibilitychange', () => {
		if (globalThis.document?.visibilityState === 'visible') {
			refreshIfSnapshotTokenChanged();
		}
	});

	void refresh();

	return {
		snapshot,
		isLoading,
		notice,
		isConnected: computed(() => snapshot.value.status === 'available'),
		hasStoredSnapshotToken: computed(() => Boolean(readStoredSnapshotToken())),
		refresh,
		clearNotice,
		openConnectOrCreateAccount,
		openAccountSettings,
		openManagePassword,
		openSyncSignedInAccount,
		disconnectFoundrySession
	};
});