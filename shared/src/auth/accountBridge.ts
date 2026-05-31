/**
 * File: accountBridge.ts
 * Purpose: Manage Foundry-side RPGM Tools account snapshots and account-backed Forge usage reads.
 * Notes: Keeps the legacy Foundry bridge on the same snapshot-token lane as the shared account center and Steward-backed Forge usage endpoints.
 */

import { createGlobalState } from '@vueuse/core';

import {
	createFoundryAccountCenterHostLabel,
	createFoundryAccountCenterUrl,
	DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL,
	DEFAULT_FOUNDRY_ACCOUNT_CENTER_ORIGIN
} from './accountCenter';

const ACCOUNT_PROFILE_PATHNAME = '/api/v1/account/profile';
const ACCOUNT_SESSION_TOKEN_PATHNAME = '/api/v1/account/profile-snapshot-token';
const ACCOUNT_SESSION_RETURN_PAGE_PATHNAME =
	'/modules/rpgm-forge/account-session-return.html';
export const ACCOUNT_SESSION_TOKEN_HEADER_NAME = 'x-rpgm-account-session-token';
export const FOUNDRY_PROFILE_SNAPSHOT_TOKEN_STORAGE_KEY =
	'rpgm.foundry.profileSnapshotToken';
const ACCOUNT_SESSION_LAUNCH_MESSAGE_TYPE =
	'rpgm-account-session-launch-result';
const ACCOUNT_SESSION_LAUNCH_ACK_MESSAGE_TYPE =
	'rpgm-account-session-launch-ack';
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
const ACCOUNT_CENTER_HOST_LABEL = createFoundryAccountCenterHostLabel();

interface FoundryAccountBridgeNotice {
	kind: 'info' | 'warning';
	message: string;
}

interface FoundryAccountSessionLaunchMessage {
	type: typeof ACCOUNT_SESSION_LAUNCH_MESSAGE_TYPE;
	accountSessionToken: string | null;
	accountSessionError: string | null;
	accountSessionErrorDescription: string | null;
	redirectUrl: string | null;
}

export interface FoundryAccountBridgeSnapshot {
	status: 'available' | 'signed-out' | 'unavailable';
	sourceSummary: string;
	displayName: string;
	profileSummary: string;
	visibilitySummary: string;
	activeTierName: string | null;
	membershipStatus: string | null;
	membershipSummary: string;
	usageRemaining: number | null;
	usageLimit: number | null;
	usageOverLimit: boolean | null;
	usageReadinessSummary: string;
	spendableOre: number | null;
	lifetimeOre: number | null;
	economySummary: string;
}

interface FoundryAccountBridgeMembershipState {
	activeTierName: string | null;
	membershipStatus: string | null;
}

interface FoundryAccountBridgeUsageReadinessState {
	remaining: number | null;
	limit: number | null;
	overLimit: boolean | null;
}

interface FoundryAccountBridgeEconomyState {
	spendableOre: number | null;
	lifetimeOre: number | null;
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
		profileSummary: `Profile changes stay on ${ACCOUNT_CENTER_HOST_LABEL}.`,
		visibilitySummary:
			'Profile visibility will appear after the account loads.',
		activeTierName: null,
		membershipStatus: null,
		membershipSummary: 'No membership is loaded yet.',
		usageRemaining: null,
		usageLimit: null,
		usageOverLimit: null,
		usageReadinessSummary: 'No managed usage is loaded yet.',
		spendableOre: null,
		lifetimeOre: null,
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
		profileSummary: `Profile changes stay on ${ACCOUNT_CENTER_HOST_LABEL}.`,
		visibilitySummary:
			'Profile visibility is unavailable until the next successful refresh.',
		activeTierName: null,
		membershipStatus: null,
		membershipSummary:
			'Membership is unavailable until the next successful refresh.',
		usageRemaining: null,
		usageLimit: null,
		usageOverLimit: null,
		usageReadinessSummary:
			'Managed usage is unavailable until the next successful refresh.',
		spendableOre: null,
		lifetimeOre: null,
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

function readMembershipState(
	privateExpansions: unknown
): FoundryAccountBridgeMembershipState {
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

	return {
		activeTierName,
		membershipStatus
	};
}

function createMembershipSummary(
	membershipState: FoundryAccountBridgeMembershipState
): string {
	const { activeTierName, membershipStatus } = membershipState;

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

function readUsageReadinessState(
	privateExpansions: unknown
): FoundryAccountBridgeUsageReadinessState {
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

	return {
		remaining: normalizeFiniteNumber(snapshot?.remaining),
		limit: normalizeFiniteNumber(snapshot?.limit),
		overLimit:
			typeof snapshot?.overLimit === 'boolean' ? snapshot.overLimit : null
	};
}

function createUsageReadinessSummary(
	usageReadinessState: FoundryAccountBridgeUsageReadinessState
): string {
	const { remaining, limit, overLimit } = usageReadinessState;

	if (overLimit) {
		return 'Managed Forge usage is currently beyond the visible allowance.';
	}

	if (remaining !== null && limit !== null) {
		return `${remaining} of ${limit} managed runs remain in the current visible allowance.`;
	}

	return 'Managed Forge usage is not visible in this Foundry session yet.';
}

function readEconomyState(
	privateExpansions: unknown
): FoundryAccountBridgeEconomyState {
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

	return {
		spendableOre: normalizeFiniteNumber(oreBalance?.spendableBalance),
		lifetimeOre: normalizeFiniteNumber(oreBalance?.lifetimeBalance)
	};
}

function createEconomySummary(
	economyState: FoundryAccountBridgeEconomyState
): string {
	const { spendableOre, lifetimeOre } = economyState;

	if (spendableOre !== null) {
		return `${spendableOre} Ore is currently spendable from this account.`;
	}

	if (lifetimeOre !== null) {
		return `${lifetimeOre} lifetime Ore has been recorded for this account.`;
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
	const membershipState = readMembershipState(privateExpansions);
	const usageReadinessState = readUsageReadinessState(privateExpansions);
	const economyState = readEconomyState(privateExpansions);
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
		activeTierName: membershipState.activeTierName,
		membershipStatus: membershipState.membershipStatus,
		membershipSummary: createMembershipSummary(membershipState),
		usageRemaining: usageReadinessState.remaining,
		usageLimit: usageReadinessState.limit,
		usageOverLimit: usageReadinessState.overLimit,
		usageReadinessSummary: createUsageReadinessSummary(usageReadinessState),
		spendableOre: economyState.spendableOre,
		lifetimeOre: economyState.lifetimeOre,
		economySummary: createEconomySummary(economyState)
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

function readLocationHashQueryParams(currentUrl: URL): {
	hashPath: string;
	hashParams: URLSearchParams;
} {
	const normalizedHash = currentUrl.hash.startsWith('#')
		? currentUrl.hash.slice(1)
		: currentUrl.hash;
	const hashQuerySeparatorIndex = normalizedHash.indexOf('?');
	const hashPath =
		hashQuerySeparatorIndex === -1
			? normalizedHash.includes('=') || normalizedHash.includes('&')
				? ''
				: normalizedHash
			: normalizedHash.slice(0, hashQuerySeparatorIndex);
	const hashQuery =
		hashQuerySeparatorIndex === -1
			? hashPath
				? ''
				: normalizedHash
			: normalizedHash.slice(hashQuerySeparatorIndex + 1);

	return {
		hashPath,
		hashParams: new URLSearchParams(hashQuery)
	};
}

function readLocationReturnParam(
	currentUrl: URL,
	paramName: string
): string | null {
	return (
		normalizeOptionalText(currentUrl.searchParams.get(paramName)) ??
		normalizeOptionalText(
			readLocationHashQueryParams(currentUrl).hashParams.get(paramName)
		)
	);
}

function clearLocationReturnParams(currentUrl: URL, paramNames: string[]) {
	for (const paramName of paramNames) {
		currentUrl.searchParams.delete(paramName);
	}

	const { hashPath, hashParams } = readLocationHashQueryParams(currentUrl);

	for (const paramName of paramNames) {
		hashParams.delete(paramName);
	}

	const nextHashQuery = hashParams.toString();
	currentUrl.hash = hashPath
		? nextHashQuery
			? `${hashPath}?${nextHashQuery}`
			: hashPath
		: nextHashQuery;
}

function repairFoundryRouteClass(currentUrl: URL) {
	const body = globalThis.document?.body;

	if (!body) {
		return;
	}

	const routeClass = normalizeOptionalText(
		currentUrl.pathname.split('/').filter(Boolean).at(-1)
	);
	const pollutedClasses = Array.from(body.classList).filter(
		className => className.includes('?') || className.includes('#')
	);

	for (const pollutedClass of pollutedClasses) {
		const normalizedClass = pollutedClass.split(/[?#]/u, 1)[0]?.trim();
		body.classList.remove(pollutedClass);

		if (normalizedClass) {
			body.classList.add(normalizedClass);
		}
	}

	if (routeClass) {
		body.classList.add(routeClass);
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

function createAccountSessionResultNotice(input: {
	accountSessionToken: string | null;
	accountSessionError: string | null;
	accountSessionErrorDescription: string | null;
}): FoundryAccountBridgeNotice | null {
	if (!input.accountSessionToken && !input.accountSessionError) {
		return null;
	}

	if (input.accountSessionToken) {
		writeStoredSnapshotToken(input.accountSessionToken);
		return {
			kind: 'info',
			message:
				'Foundry received a signed-in Steward account snapshot. Refreshing the legacy bridge lane now.'
		};
	}

	return {
		kind: 'warning',
		message:
			input.accountSessionErrorDescription ??
			`Steward account sync returned ${input.accountSessionError}.`
	};
}

function normalizeAccountSessionLaunchMessage(
	value: unknown
): FoundryAccountSessionLaunchMessage | null {
	if (!value || typeof value !== 'object') {
		return null;
	}

	const typedValue = value as {
		type?: unknown;
		accountSessionToken?: unknown;
		accountSessionError?: unknown;
		accountSessionErrorDescription?: unknown;
		redirectUrl?: unknown;
	};

	if (typedValue.type !== ACCOUNT_SESSION_LAUNCH_MESSAGE_TYPE) {
		return null;
	}

	return {
		type: ACCOUNT_SESSION_LAUNCH_MESSAGE_TYPE,
		accountSessionToken: normalizeOptionalText(
			typedValue.accountSessionToken
		),
		accountSessionError: normalizeOptionalText(
			typedValue.accountSessionError
		),
		accountSessionErrorDescription: normalizeOptionalText(
			typedValue.accountSessionErrorDescription
		),
		redirectUrl: normalizeOptionalText(typedValue.redirectUrl)
	};
}

function postAccountSessionLaunchAcknowledgement(event: MessageEvent) {
	const source = event.source;

	if (!source || typeof source !== 'object' || !('postMessage' in source)) {
		return;
	}

	try {
		(
			source as {
				postMessage: (message: unknown, targetOrigin: string) => void;
			}
		).postMessage(
			{ type: ACCOUNT_SESSION_LAUNCH_ACK_MESSAGE_TYPE },
			event.origin
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
		snapshot?: unknown;
		used?: unknown;
		limit?: unknown;
		remaining?: unknown;
		overLimit?: unknown;
	};
	const snapshotPayload =
		typedPayload?.snapshot && typeof typedPayload.snapshot === 'object'
			? (typedPayload.snapshot as {
					used?: unknown;
					limit?: unknown;
					remaining?: unknown;
					overLimit?: unknown;
				})
			: typedPayload;
	const used = normalizeFiniteNumber(snapshotPayload?.used);
	const overLimit =
		typeof snapshotPayload?.overLimit === 'boolean'
			? snapshotPayload.overLimit
			: null;

	if (used === null || overLimit === null) {
		return null;
	}

	return {
		used,
		limit: normalizeFiniteNumber(snapshotPayload.limit),
		remaining: normalizeFiniteNumber(snapshotPayload.remaining),
		overLimit
	};
}

export async function loadAccountBackedForgeUsageSnapshot(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
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
			new URL('/api/forge/usage', baseUrl).toString(),
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
		readLocationReturnParam(
			currentUrl,
			ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionToken
		) ??
		readLocationReturnParam(
			currentUrl,
			ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.foundryProfileSnapshotToken
		);
	const accountSessionError = readLocationReturnParam(
		currentUrl,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionError
	);
	const accountSessionErrorDescription = readLocationReturnParam(
		currentUrl,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionErrorDescription
	);

	const returnNotice = createAccountSessionResultNotice({
		accountSessionToken,
		accountSessionError,
		accountSessionErrorDescription
	});

	if (!returnNotice) {
		return null;
	}

	clearLocationReturnParams(currentUrl, [
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionToken,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.foundryProfileSnapshotToken,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionError,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionErrorDescription
	]);
	globalThis.history?.replaceState?.(
		globalThis.history.state ?? null,
		'',
		currentUrl.toString()
	);
	repairFoundryRouteClass(currentUrl);

	return returnNotice;
}

export function consumeFoundryAccountSessionReturnFromUrl(): FoundryAccountBridgeNotice | null {
	return consumeBridgeReturnFromUrl();
}

const INITIAL_BRIDGE_RETURN_NOTICE = consumeBridgeReturnFromUrl();
const INITIAL_LOCATION_URL = readCurrentLocationUrl();

if (INITIAL_LOCATION_URL) {
	repairFoundryRouteClass(INITIAL_LOCATION_URL);
}

function createAccountProfileRequestUrl(): string {
	const profileRequestUrl = new URL(
		ACCOUNT_PROFILE_PATHNAME,
		DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
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
		DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
	);
	accountSessionSyncUrl.searchParams.set(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.redirectUrl,
		currentUrl.toString()
	);

	return accountSessionSyncUrl.toString();
}

function createFoundryAccountSessionReturnUrl(currentUrl: URL): string {
	const returnUrl = new URL(
		ACCOUNT_SESSION_RETURN_PAGE_PATHNAME,
		currentUrl.origin
	);

	returnUrl.searchParams.set(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.redirectUrl,
		currentUrl.toString()
	);

	return returnUrl.toString();
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

function openExternalUrl(
	url: string | null,
	options: {
		preserveOpener?: boolean;
	} = {}
) {
	if (!url) {
		return false;
	}

	const openedWindow = globalThis.open?.(url, '_blank');

	if (openedWindow) {
		if (!options.preserveOpener) {
			try {
				openedWindow.opener = null;
			} catch {
				// Ignore cross-origin opener assignment failures.
			}
		}

		return true;
	}

	return navigateCurrentPage(url);
}

function navigateCurrentPage(url: string | null) {
	if (!url) {
		return false;
	}

	if (typeof globalThis.location?.assign === 'function') {
		globalThis.location.assign(url);
		return true;
	}

	if (typeof globalThis.location?.href === 'string') {
		globalThis.location.href = url;
		return true;
	}

	return false;
}

export const useFoundryAccountBridge = createGlobalState(() => {
	const snapshot = shallowRef<FoundryAccountBridgeSnapshot>(
		createSignedOutSnapshot()
	);
	const isLoading = ref(false);
	const hasLoadedOnce = ref(false);
	const notice = ref<FoundryAccountBridgeNotice | null>(
		INITIAL_BRIDGE_RETURN_NOTICE
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
			hasLoadedOnce.value = true;
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
			message: `Connected your RPGM Tools account from the browser session that is already signed in on ${ACCOUNT_CENTER_HOST_LABEL}.`
		};

		return true;
	};

	const openAccountCenter = (options: {
		focus: 'session' | 'connections' | 'passkeys' | 'password' | 'forge';
	}) => {
		startWatchingForReturn();
		const currentLocationUrl = readCurrentLocationUrl();
		const shouldReturnToFoundry = options.focus === 'session';
		const redirectUrl = shouldReturnToFoundry
			? currentLocationUrl
				? createFoundryAccountSessionReturnUrl(currentLocationUrl)
				: null
			: null;

		return openExternalUrl(
			createFoundryAccountCenterUrl({
				baseUrl: DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL,
				focus: options.focus,
				redirectUrl
			}),
			{ preserveOpener: shouldReturnToFoundry }
		);
	};

	const handleAccountSessionLaunchMessage = (event: MessageEvent) => {
		if (event.origin !== DEFAULT_FOUNDRY_ACCOUNT_CENTER_ORIGIN) {
			return;
		}

		const launchMessage = normalizeAccountSessionLaunchMessage(event.data);

		if (!launchMessage) {
			return;
		}

		const messageNotice = createAccountSessionResultNotice({
			accountSessionToken: launchMessage.accountSessionToken,
			accountSessionError: launchMessage.accountSessionError,
			accountSessionErrorDescription:
				launchMessage.accountSessionErrorDescription
		});

		if (!messageNotice) {
			return;
		}

		postAccountSessionLaunchAcknowledgement(event);
		notice.value = messageNotice;
		void refresh();
	};

	const openConnectOrCreateAccount = () => {
		if (snapshot.value.status === 'available') {
			notice.value = {
				kind: 'info',
				message:
					'Your RPGM Tools account is already connected in this Foundry session.'
			};
			return;
		}

		if (openAccountCenter({ focus: 'session' })) {
			return;
		}

		void trySilentConnectFromActiveBrowserSession().then(connected => {
			if (connected) {
				return;
			}

			stopWatchingForReturn();
			notice.value = {
				kind: 'warning',
				message:
					'Foundry could not open the RPGM Tools account sign-in flow just now.'
			};
		});
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

	const openForgeMembership = () => {
		if (!openAccountCenter({ focus: 'forge' })) {
			stopWatchingForReturn();
			notice.value = {
				kind: 'warning',
				message:
					'Foundry could not open the RPGM Tools membership view just now.'
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
	globalThis.addEventListener?.('message', handleAccountSessionLaunchMessage);
	globalThis.addEventListener?.('visibilitychange', () => {
		if (globalThis.document?.visibilityState === 'visible') {
			refreshIfReturnDetected();
		}
	});

	void refresh();

	return {
		snapshot,
		isLoading,
		hasLoadedOnce,
		notice,
		isConnected: computed(() => snapshot.value.status === 'available'),
		hasStoredSnapshotToken: computed(() =>
			Boolean(readStoredSnapshotToken())
		),
		refresh,
		clearNotice,
		openConnectOrCreateAccount,
		openAccountSettings,
		openForgeMembership,
		disconnectFoundrySession
	};
});
