/**
 * File: accountBridge.ts
 * Purpose: Manage Foundry-side RPGM Tools delegated account connections and account-backed Forge usage reads.
 * Notes: The active Foundry <-> web auth flow uses delegated PKCE authorization, bearer profile reads, and delegated refresh only.
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
const ACCOUNT_DELEGATED_TOKEN_PATHNAME = '/api/v1/account/token';
const ACCOUNT_DELEGATED_REVOKE_PATHNAME = '/api/v1/account/revoke';
const ACCOUNT_SESSION_RETURN_PAGE_PATHNAME =
	'/modules/rpgm-forge/account-session-return.html';
export const ACCOUNT_SESSION_TOKEN_HEADER_NAME = 'x-rpgm-account-session-token';
export const ACCOUNT_PROFILE_SNAPSHOT_TOKEN_HEADER_NAME =
	'x-rpgm-profile-snapshot-token';
export const FOUNDRY_PROFILE_SNAPSHOT_TOKEN_STORAGE_KEY =
	'rpgm.foundry.profileSnapshotToken';
const FOUNDRY_DELEGATED_AUTH_REQUEST_STORAGE_KEY =
	'rpgm.foundry.accountDelegatedAuthRequest';
const FOUNDRY_DELEGATED_CONNECTION_STORAGE_KEY =
	'rpgm.foundry.accountDelegatedConnection';
const FOUNDRY_DELEGATED_AUTH_RETURN_STORAGE_KEY =
	'rpgm.foundry.accountDelegatedAuthorizationReturn';
const ACCOUNT_SESSION_LAUNCH_MESSAGE_TYPE =
	'rpgm-account-session-launch-result';
const ACCOUNT_SESSION_LAUNCH_ACK_MESSAGE_TYPE =
	'rpgm-account-session-launch-ack';
const ACCOUNT_BACKED_FORGE_USAGE_PATHNAMES = [
	'/api/v1/forge/usage',
	'/api/forge/usage'
] as const;
const RETURN_REFRESH_POLL_INTERVAL_MS = 1500;
const RETURN_REFRESH_POLL_TIMEOUT_MS = 45000;
const ACCOUNT_CENTER_CURRENT_TAB_FALLBACK_DELAY_MS = 1250;
const ACCOUNT_PROFILE_QUERY_PARAMS = {
	expand: 'expand'
} as const;
const ACCOUNT_SESSION_TOKEN_QUERY_PARAMS = {
	accountSessionToken: 'accountSessionToken',
	foundryProfileSnapshotToken: 'foundryProfileSnapshotToken',
	profileSnapshotToken: 'profileSnapshotToken',
	redirectUrl: 'redirectUrl',
	hostOrigin: 'hostOrigin',
	accountSessionError: 'accountSessionError',
	accountSessionErrorDescription: 'accountSessionErrorDescription'
} as const;
const ACCOUNT_DELEGATED_AUTH_QUERY_PARAMS = {
	accountAuthorizationCode: 'accountAuthorizationCode',
	accountAuthorizationState: 'accountAuthorizationState'
} as const;
const ACCOUNT_DELEGATED_AUTH_LAUNCH_QUERY_PARAMS = {
	challenge: 'delegatedAuthChallenge',
	challengeMethod: 'delegatedAuthChallengeMethod',
	state: 'delegatedAuthState'
} as const;
const DELEGATED_PKCE_CHALLENGE_METHOD = 'S256';
const DELEGATED_ACCESS_TOKEN_FRESHNESS_WINDOW_MS = 60_000;
const ACCOUNT_PROFILE_EXPANSIONS = [
	'membership',
	'entitlements',
	'usage-readiness',
	'economy'
] as const;
const ACCOUNT_CENTER_HOST_LABEL = createFoundryAccountCenterHostLabel();
let accountSessionTokenRefreshInFlight: Promise<string | null> | null = null;

interface FoundryAccountBridgeNotice {
	kind: 'info' | 'warning';
	message: string;
}

interface FoundryAccountSessionLaunchMessage {
	type: typeof ACCOUNT_SESSION_LAUNCH_MESSAGE_TYPE;
	accountSessionToken: string | null;
	accountAuthorizationCode: string | null;
	accountAuthorizationState: string | null;
	accountSessionError: string | null;
	accountSessionErrorDescription: string | null;
	redirectUrl: string | null;
}

interface FoundryDelegatedAuthRequest {
	verifier: string;
	challenge: string;
	challengeMethod: typeof DELEGATED_PKCE_CHALLENGE_METHOD;
	state: string;
	hostOrigin: string;
	createdAt: number;
}

interface FoundryDelegatedConnection {
	accessToken: string;
	accessTokenExpiresAt: number;
	connectionGrant: string;
	connectionGrantExpiresAt: number;
	accountAuthorizationState: string | null;
	obtainedAt: number;
}

interface FoundryDelegatedAuthorizationReturn {
	accountAuthorizationCode: string;
	accountAuthorizationState: string | null;
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
	managedForgeAccess: boolean | null;
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
	used: number | null;
	remaining: number | null;
	limit: number | null;
	overLimit: boolean | null;
	managedForgeAccess: boolean | null;
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

function normalizePkceCodeChallenge(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null;
	}

	const normalizedValue = value.trim();

	return /^[A-Za-z0-9_-]{43,128}$/u.test(normalizedValue)
		? normalizedValue
		: null;
}

function normalizePkceCodeVerifier(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null;
	}

	const normalizedValue = value.trim();

	return /^[A-Za-z0-9\-._~]{43,128}$/u.test(normalizedValue)
		? normalizedValue
		: null;
}

function normalizeDelegatedAuthorizationState(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null;
	}

	const normalizedValue = value.trim();

	return normalizedValue.length > 0 && normalizedValue.length <= 256
		? normalizedValue
		: null;
}

function encodeBase64Url(bytes: Uint8Array): string {
	let binary = '';

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary)
		.replace(/\+/gu, '-')
		.replace(/\//gu, '_')
		.replace(/=+$/u, '');
}

function createRandomBase64Url(byteLength: number): string | null {
	const cryptoImplementation = globalThis.crypto;

	if (!cryptoImplementation?.getRandomValues) {
		return null;
	}

	const bytes = new Uint8Array(byteLength);
	cryptoImplementation.getRandomValues(bytes);

	return encodeBase64Url(bytes);
}

async function createPkceCodeChallenge(
	codeVerifier: string
): Promise<string | null> {
	const cryptoImplementation = globalThis.crypto;

	if (!cryptoImplementation?.subtle) {
		return null;
	}

	const digest = await cryptoImplementation.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(codeVerifier)
	);

	return encodeBase64Url(new Uint8Array(digest));
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
		managedForgeAccess: null,
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
		managedForgeAccess: null,
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
				managedForgeAccess?: boolean | null;
				snapshot?: {
					used?: number | null;
					remaining?: number | null;
					limit?: number | null;
					overLimit?: boolean | null;
				};
			};
		}
	).usageReadiness;

	return {
		used: normalizeFiniteNumber(snapshot?.snapshot?.used),
		remaining: normalizeFiniteNumber(snapshot?.snapshot?.remaining),
		limit: normalizeFiniteNumber(snapshot?.snapshot?.limit),
		overLimit:
			typeof snapshot?.snapshot?.overLimit === 'boolean'
				? snapshot.snapshot.overLimit
				: null,
		managedForgeAccess:
			typeof snapshot?.managedForgeAccess === 'boolean'
				? snapshot.managedForgeAccess
				: null
	};
}

function createUsageReadinessSummary(
	usageReadinessState: FoundryAccountBridgeUsageReadinessState
): string {
	const { used, remaining, limit, overLimit, managedForgeAccess } =
		usageReadinessState;

	if (overLimit) {
		return 'Managed Forge usage is currently beyond the visible allowance.';
	}

	if (remaining !== null && limit !== null) {
		return `${remaining} of ${limit} managed runs remain in the current visible allowance.`;
	}

	if (managedForgeAccess) {
		if (used !== null) {
			return `Managed Forge usage is available for this account. ${used} run${used === 1 ? '' : 's'} used in the current visible window.`;
		}

		return 'Managed Forge usage is available for this account.';
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
		managedForgeAccess: usageReadinessState.managedForgeAccess,
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

function isAllowedAccountSessionLaunchOrigin(origin: string): boolean {
	if (origin === DEFAULT_FOUNDRY_ACCOUNT_CENTER_ORIGIN) {
		return true;
	}

	const currentUrl = readCurrentLocationUrl();

	return Boolean(currentUrl && origin === currentUrl.origin);
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

function readStoredDelegatedAuthRequest(): FoundryDelegatedAuthRequest | null {
	try {
		const rawValue = globalThis.localStorage?.getItem(
			FOUNDRY_DELEGATED_AUTH_REQUEST_STORAGE_KEY
		);

		if (!rawValue) {
			return null;
		}

		const parsedValue = JSON.parse(
			rawValue
		) as Partial<FoundryDelegatedAuthRequest>;
		const verifier = normalizePkceCodeVerifier(parsedValue.verifier);
		const challenge = normalizePkceCodeChallenge(parsedValue.challenge);
		const state = normalizeDelegatedAuthorizationState(parsedValue.state);
		const hostOrigin = normalizeOptionalText(parsedValue.hostOrigin);
		const createdAt = normalizeFiniteNumber(parsedValue.createdAt);

		if (
			!verifier ||
			!challenge ||
			!state ||
			!hostOrigin ||
			createdAt === null
		) {
			return null;
		}

		return {
			verifier,
			challenge,
			challengeMethod: DELEGATED_PKCE_CHALLENGE_METHOD,
			state,
			hostOrigin,
			createdAt
		};
	} catch {
		return null;
	}
}

function writeStoredDelegatedAuthRequest(
	request: FoundryDelegatedAuthRequest | null
) {
	try {
		if (request) {
			globalThis.localStorage?.setItem(
				FOUNDRY_DELEGATED_AUTH_REQUEST_STORAGE_KEY,
				JSON.stringify(request)
			);
			return;
		}

		globalThis.localStorage?.removeItem(
			FOUNDRY_DELEGATED_AUTH_REQUEST_STORAGE_KEY
		);
	} catch {
		return;
	}
}

function readStoredDelegatedConnection(): FoundryDelegatedConnection | null {
	try {
		const rawValue = globalThis.localStorage?.getItem(
			FOUNDRY_DELEGATED_CONNECTION_STORAGE_KEY
		);

		if (!rawValue) {
			return null;
		}

		const parsedValue = JSON.parse(
			rawValue
		) as Partial<FoundryDelegatedConnection>;
		const accessToken = normalizeOptionalText(parsedValue.accessToken);
		const connectionGrant = normalizeOptionalText(
			parsedValue.connectionGrant
		);
		const accessTokenExpiresAt = normalizeFiniteNumber(
			parsedValue.accessTokenExpiresAt
		);
		const connectionGrantExpiresAt = normalizeFiniteNumber(
			parsedValue.connectionGrantExpiresAt
		);
		const obtainedAt =
			normalizeFiniteNumber(parsedValue.obtainedAt) ?? Date.now();

		if (
			!accessToken ||
			!connectionGrant ||
			accessTokenExpiresAt === null ||
			connectionGrantExpiresAt === null
		) {
			return null;
		}

		return {
			accessToken,
			accessTokenExpiresAt,
			connectionGrant,
			connectionGrantExpiresAt,
			accountAuthorizationState: normalizeDelegatedAuthorizationState(
				parsedValue.accountAuthorizationState
			),
			obtainedAt
		};
	} catch {
		return null;
	}
}

function writeStoredDelegatedConnection(
	connection: FoundryDelegatedConnection | null
) {
	try {
		if (connection) {
			globalThis.localStorage?.setItem(
				FOUNDRY_DELEGATED_CONNECTION_STORAGE_KEY,
				JSON.stringify(connection)
			);
			return;
		}

		globalThis.localStorage?.removeItem(
			FOUNDRY_DELEGATED_CONNECTION_STORAGE_KEY
		);
	} catch {
		return;
	}
}

function readStoredDelegatedAuthorizationReturn(): FoundryDelegatedAuthorizationReturn | null {
	try {
		const rawValue = globalThis.localStorage?.getItem(
			FOUNDRY_DELEGATED_AUTH_RETURN_STORAGE_KEY
		);

		if (!rawValue) {
			return null;
		}

		const parsedValue = JSON.parse(
			rawValue
		) as Partial<FoundryDelegatedAuthorizationReturn>;
		const accountAuthorizationCode = normalizeOptionalText(
			parsedValue.accountAuthorizationCode
		);

		if (!accountAuthorizationCode) {
			return null;
		}

		return {
			accountAuthorizationCode,
			accountAuthorizationState: normalizeDelegatedAuthorizationState(
				parsedValue.accountAuthorizationState
			),
			redirectUrl: normalizeOptionalText(parsedValue.redirectUrl)
		};
	} catch {
		return null;
	}
}

function writeStoredDelegatedAuthorizationReturn(
	value: FoundryDelegatedAuthorizationReturn | null
) {
	try {
		if (value) {
			globalThis.localStorage?.setItem(
				FOUNDRY_DELEGATED_AUTH_RETURN_STORAGE_KEY,
				JSON.stringify(value)
			);
			return;
		}

		globalThis.localStorage?.removeItem(
			FOUNDRY_DELEGATED_AUTH_RETURN_STORAGE_KEY
		);
	} catch {
		return;
	}
}

function consumeStoredDelegatedAuthorizationReturn(): FoundryDelegatedAuthorizationReturn | null {
	const payload = readStoredDelegatedAuthorizationReturn();
	writeStoredDelegatedAuthorizationReturn(null);
	return payload;
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
	accountAuthorizationCode?: string | null;
	accountAuthorizationState?: string | null;
	redirectUrl?: string | null;
	accountSessionError: string | null;
	accountSessionErrorDescription: string | null;
}): FoundryAccountBridgeNotice | null {
	if (
		!input.accountSessionToken &&
		!input.accountAuthorizationCode &&
		!input.accountSessionError
	) {
		return null;
	}

	if (input.accountAuthorizationCode) {
		writeStoredDelegatedAuthorizationReturn({
			accountAuthorizationCode: input.accountAuthorizationCode,
			accountAuthorizationState: input.accountAuthorizationState ?? null,
			redirectUrl: input.redirectUrl ?? null
		});
	}

	if (input.accountAuthorizationCode) {
		return {
			kind: 'info',
			message:
				'Signed in successfully. Refreshing your RPGM Tools connection in Foundry now.'
		};
	}

	if (input.accountSessionToken) {
		writeStoredSnapshotToken(null);
		return {
			kind: 'warning',
			message:
				'Foundry received a legacy snapshot-token account handoff that is no longer supported. Start the RPGM Tools sign-in flow again from Foundry.'
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
		accountAuthorizationCode?: unknown;
		accountAuthorizationState?: unknown;
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
		accountAuthorizationCode: normalizeOptionalText(
			typedValue.accountAuthorizationCode
		),
		accountAuthorizationState: normalizeDelegatedAuthorizationState(
			typedValue.accountAuthorizationState
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
	writeStoredDelegatedAuthRequest(null);
	writeStoredDelegatedConnection(null);
	writeStoredDelegatedAuthorizationReturn(null);
}

export function applyFoundryAccountSessionHeaders(
	headers: Headers,
	accountSessionToken: string
): Headers {
	headers.set(ACCOUNT_SESSION_TOKEN_HEADER_NAME, accountSessionToken);
	headers.set(
		ACCOUNT_PROFILE_SNAPSHOT_TOKEN_HEADER_NAME,
		accountSessionToken
	);

	return headers;
}

async function requestFreshAccountSessionToken(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): Promise<string | null> {
	if (typeof globalThis.fetch !== 'function') {
		return null;
	}

	try {
		const accountSessionTokenUrl = new URL(
			ACCOUNT_SESSION_TOKEN_PATHNAME,
			baseUrl
		);
		const currentLocationUrl = readCurrentLocationUrl();
		const storedSnapshotToken = readStoredSnapshotToken();
		const requestHeaders = new Headers({
			accept: 'application/json'
		});

		if (currentLocationUrl) {
			accountSessionTokenUrl.searchParams.set(
				ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.hostOrigin,
				currentLocationUrl.origin
			);
		}

		if (storedSnapshotToken) {
			applyFoundryAccountSessionHeaders(
				requestHeaders,
				storedSnapshotToken
			);
		}

		const response = await globalThis.fetch(
			accountSessionTokenUrl.toString(),
			{
				method: 'GET',
				credentials: 'include',
				cache: 'no-store',
				headers: requestHeaders
			}
		);
		const payload = (await response.json().catch(() => null)) as {
			accountSessionToken?: unknown;
			profileSnapshotToken?: unknown;
		} | null;

		if (!response.ok) {
			return null;
		}

		const accountSessionToken =
			normalizeOptionalText(payload?.accountSessionToken) ??
			normalizeOptionalText(payload?.profileSnapshotToken);

		if (!accountSessionToken) {
			return null;
		}

		writeStoredSnapshotToken(accountSessionToken);
		return accountSessionToken;
	} catch {
		return null;
	}
}

function collectAccountSessionRefreshBaseUrls(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): string[] {
	const candidateBaseUrls = [
		baseUrl,
		DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL,
		globalThis.location?.origin
	].filter(Boolean);
	const distinctBaseUrls: string[] = [];

	for (const candidateBaseUrl of candidateBaseUrls) {
		try {
			const normalizedBaseUrl = new URL(candidateBaseUrl).toString();

			if (!distinctBaseUrls.includes(normalizedBaseUrl)) {
				distinctBaseUrls.push(normalizedBaseUrl);
			}
		} catch {
			continue;
		}
	}

	return distinctBaseUrls;
}

async function requestFreshAccountSessionTokenFromKnownBases(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): Promise<string | null> {
	for (const candidateBaseUrl of collectAccountSessionRefreshBaseUrls(
		baseUrl
	)) {
		const refreshedToken =
			await requestFreshAccountSessionToken(candidateBaseUrl);

		if (refreshedToken) {
			return refreshedToken;
		}
	}

	return null;
}

export async function refreshFoundryAccountSessionToken(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): Promise<string | null> {
	if (!accountSessionTokenRefreshInFlight) {
		accountSessionTokenRefreshInFlight =
			requestFreshAccountSessionTokenFromKnownBases(baseUrl).finally(
				() => {
					accountSessionTokenRefreshInFlight = null;
				}
			);
	}

	return accountSessionTokenRefreshInFlight;
}

function applyDelegatedAccessTokenHeaders(
	headers: Headers,
	accessToken: string
): Headers {
	headers.set('authorization', `Bearer ${accessToken}`);
	return headers;
}

export async function createFoundryDelegatedAuthorizationHeaders(
	input: {
		baseUrl?: string | URL;
		headers?: HeadersInit;
	} = {}
): Promise<Headers | null> {
	const delegatedConnection = await ensureFoundryDelegatedConnection(
		input.baseUrl
	);
	const accessToken = delegatedConnection?.accessToken;

	if (!accessToken) {
		return null;
	}

	return applyDelegatedAccessTokenHeaders(
		new Headers(input.headers),
		accessToken
	);
}

export async function refreshFoundryDelegatedAuthorizationHeaders(
	input: {
		baseUrl?: string | URL;
		headers?: HeadersInit;
	} = {}
): Promise<Headers | null> {
	const delegatedConnection = await refreshStoredDelegatedConnection(
		input.baseUrl
	);
	const accessToken = delegatedConnection?.accessToken;

	if (!accessToken) {
		return null;
	}

	return applyDelegatedAccessTokenHeaders(
		new Headers(input.headers),
		accessToken
	);
}

function isFreshDelegatedConnection(
	connection: FoundryDelegatedConnection | null,
	now: number = Date.now()
): boolean {
	return Boolean(
		connection &&
		connection.accessTokenExpiresAt >
			now + DELEGATED_ACCESS_TOKEN_FRESHNESS_WINDOW_MS
	);
}

function normalizeDelegatedTokenExchangePayload(
	payload: unknown
): FoundryDelegatedConnection | null {
	const typedPayload = payload as {
		accessToken?: unknown;
		accessTokenExpiresAt?: unknown;
		connectionGrant?: unknown;
		connectionGrantExpiresAt?: unknown;
		accountAuthorizationState?: unknown;
	};
	const accessToken = normalizeOptionalText(typedPayload.accessToken);
	const connectionGrant = normalizeOptionalText(typedPayload.connectionGrant);
	const accessTokenExpiresAt = normalizeFiniteNumber(
		typedPayload.accessTokenExpiresAt
	);
	const connectionGrantExpiresAt = normalizeFiniteNumber(
		typedPayload.connectionGrantExpiresAt
	);

	if (
		!accessToken ||
		!connectionGrant ||
		accessTokenExpiresAt === null ||
		connectionGrantExpiresAt === null
	) {
		return null;
	}

	return {
		accessToken,
		accessTokenExpiresAt,
		connectionGrant,
		connectionGrantExpiresAt,
		accountAuthorizationState: normalizeDelegatedAuthorizationState(
			typedPayload.accountAuthorizationState
		),
		obtainedAt: Date.now()
	};
}

async function createDelegatedAuthRequest(
	hostOrigin: string
): Promise<FoundryDelegatedAuthRequest | null> {
	const verifier = createRandomBase64Url(32);

	if (!verifier) {
		return null;
	}

	const challenge = await createPkceCodeChallenge(verifier);

	if (!challenge) {
		return null;
	}

	const state = createRandomBase64Url(16);

	if (!state) {
		return null;
	}

	const request = {
		verifier,
		challenge,
		challengeMethod: DELEGATED_PKCE_CHALLENGE_METHOD,
		state,
		hostOrigin,
		createdAt: Date.now()
	} satisfies FoundryDelegatedAuthRequest;

	writeStoredDelegatedAuthRequest(request);
	return request;
}

async function requestDelegatedTokenExchange(
	baseUrl: string | URL,
	body: Record<string, unknown>
): Promise<FoundryDelegatedConnection | null> {
	if (typeof globalThis.fetch !== 'function') {
		return null;
	}

	try {
		const response = await globalThis.fetch(
			new URL(ACCOUNT_DELEGATED_TOKEN_PATHNAME, baseUrl).toString(),
			{
				method: 'POST',
				cache: 'no-store',
				credentials: 'omit',
				headers: {
					accept: 'application/json',
					'content-type': 'application/json'
				},
				body: JSON.stringify(body)
			}
		);
		const payload = await response.json().catch(() => null);

		if (!response.ok) {
			return null;
		}

		return normalizeDelegatedTokenExchangePayload(payload);
	} catch {
		return null;
	}
}

async function requestDelegatedTokenExchangeFromKnownBases(
	baseUrl: string | URL,
	body: Record<string, unknown>
): Promise<FoundryDelegatedConnection | null> {
	for (const candidateBaseUrl of collectAccountSessionRefreshBaseUrls(
		baseUrl
	)) {
		const connection = await requestDelegatedTokenExchange(
			candidateBaseUrl,
			body
		);

		if (connection) {
			return connection;
		}
	}

	return null;
}

async function exchangeStoredDelegatedAuthorizationReturn(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): Promise<FoundryDelegatedConnection | null> {
	const authorizationReturn = consumeStoredDelegatedAuthorizationReturn();

	if (!authorizationReturn) {
		return null;
	}

	const authRequest = readStoredDelegatedAuthRequest();

	if (!authRequest) {
		return null;
	}

	if (
		authorizationReturn.accountAuthorizationState &&
		authorizationReturn.accountAuthorizationState !== authRequest.state
	) {
		writeStoredDelegatedAuthRequest(null);
		return null;
	}

	const connection = await requestDelegatedTokenExchangeFromKnownBases(
		baseUrl,
		{
			grantType: 'authorization_code',
			code: authorizationReturn.accountAuthorizationCode,
			codeVerifier: authRequest.verifier
		}
	);

	if (!connection) {
		return null;
	}

	writeStoredSnapshotToken(null);
	writeStoredDelegatedConnection(connection);
	writeStoredDelegatedAuthRequest(null);
	return connection;
}

async function refreshStoredDelegatedConnection(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): Promise<FoundryDelegatedConnection | null> {
	const connection = readStoredDelegatedConnection();

	if (!connection) {
		return null;
	}

	if (connection.connectionGrantExpiresAt <= Date.now()) {
		writeStoredDelegatedConnection(null);
		return null;
	}

	const refreshedConnection =
		await requestDelegatedTokenExchangeFromKnownBases(baseUrl, {
			grantType: 'refresh_token',
			connectionGrant: connection.connectionGrant
		});

	if (!refreshedConnection) {
		return null;
	}

	writeStoredDelegatedConnection(refreshedConnection);
	return refreshedConnection;
}

async function ensureFoundryDelegatedConnection(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): Promise<FoundryDelegatedConnection | null> {
	const exchangedConnection =
		await exchangeStoredDelegatedAuthorizationReturn(baseUrl);

	if (isFreshDelegatedConnection(exchangedConnection)) {
		return exchangedConnection;
	}

	const storedConnection = readStoredDelegatedConnection();

	if (isFreshDelegatedConnection(storedConnection)) {
		return storedConnection;
	}

	if (!storedConnection) {
		return null;
	}

	if (storedConnection.connectionGrantExpiresAt <= Date.now()) {
		writeStoredDelegatedConnection(null);
		return null;
	}

	return refreshStoredDelegatedConnection(baseUrl);
}

async function revokeStoredDelegatedConnection(
	baseUrl: string | URL = DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
): Promise<void> {
	const connection = readStoredDelegatedConnection();

	if (!connection || typeof globalThis.fetch !== 'function') {
		return;
	}

	for (const candidateBaseUrl of collectAccountSessionRefreshBaseUrls(
		baseUrl
	)) {
		try {
			await globalThis.fetch(
				new URL(
					ACCOUNT_DELEGATED_REVOKE_PATHNAME,
					candidateBaseUrl
				).toString(),
				{
					method: 'POST',
					cache: 'no-store',
					credentials: 'omit',
					headers: {
						accept: 'application/json',
						'content-type': 'application/json'
					},
					body: JSON.stringify({
						connectionGrant: connection.connectionGrant
					})
				}
			);
			return;
		} catch {
			continue;
		}
	}
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

	let delegatedConnection = await ensureFoundryDelegatedConnection(baseUrl);

	if (delegatedConnection?.accessToken) {
		for (const usagePathname of ACCOUNT_BACKED_FORGE_USAGE_PATHNAMES) {
			let retriedAfterGrantRefresh = false;

			try {
				while (true) {
					const accessToken = delegatedConnection?.accessToken;

					if (!accessToken) {
						break;
					}

					const response = await fetchImplementation(
						new URL(usagePathname, baseUrl).toString(),
						{
							method: 'GET',
							headers: applyDelegatedAccessTokenHeaders(
								new Headers({
									accept: 'application/json'
								}),
								accessToken
							),
							credentials: 'omit',
							cache: 'no-store'
						}
					);
					const payload = await response.json().catch(() => null);

					if (response.status === 401 && !retriedAfterGrantRefresh) {
						retriedAfterGrantRefresh = true;
						delegatedConnection =
							await refreshStoredDelegatedConnection(baseUrl);

						if (delegatedConnection?.accessToken) {
							continue;
						}
					}

					if (!response.ok) {
						break;
					}

					const normalizedSnapshot =
						normalizeAccountBackedForgeUsageSnapshot(payload);

					if (normalizedSnapshot) {
						return normalizedSnapshot;
					}

					break;
				}
			} catch {
				continue;
			}
		}
	}

	return null;
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
		) ??
		readLocationReturnParam(
			currentUrl,
			ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.profileSnapshotToken
		);
	const accountSessionError = readLocationReturnParam(
		currentUrl,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionError
	);
	const accountSessionErrorDescription = readLocationReturnParam(
		currentUrl,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionErrorDescription
	);
	const accountAuthorizationCode = readLocationReturnParam(
		currentUrl,
		ACCOUNT_DELEGATED_AUTH_QUERY_PARAMS.accountAuthorizationCode
	);
	const accountAuthorizationState = readLocationReturnParam(
		currentUrl,
		ACCOUNT_DELEGATED_AUTH_QUERY_PARAMS.accountAuthorizationState
	);

	const returnNotice = createAccountSessionResultNotice({
		accountSessionToken,
		accountAuthorizationCode,
		accountAuthorizationState,
		redirectUrl: readLocationReturnParam(
			currentUrl,
			ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.redirectUrl
		),
		accountSessionError,
		accountSessionErrorDescription
	});

	if (!returnNotice) {
		return null;
	}

	clearLocationReturnParams(currentUrl, [
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionToken,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.foundryProfileSnapshotToken,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.profileSnapshotToken,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionError,
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionErrorDescription,
		ACCOUNT_DELEGATED_AUTH_QUERY_PARAMS.accountAuthorizationCode,
		ACCOUNT_DELEGATED_AUTH_QUERY_PARAMS.accountAuthorizationState
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

export const FOUNDRY_ACCOUNT_SESSION_RETURN_QUERY_KEYS = Object.freeze([
	ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionToken,
	ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.foundryProfileSnapshotToken,
	ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.profileSnapshotToken,
	ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionError,
	ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.accountSessionErrorDescription,
	ACCOUNT_DELEGATED_AUTH_QUERY_PARAMS.accountAuthorizationCode,
	ACCOUNT_DELEGATED_AUTH_QUERY_PARAMS.accountAuthorizationState
] as const);

const INITIAL_BRIDGE_RETURN_NOTICE = consumeBridgeReturnFromUrl();
const INITIAL_LOCATION_URL = readCurrentLocationUrl();

if (INITIAL_LOCATION_URL) {
	repairFoundryRouteClass(INITIAL_LOCATION_URL);
}

function createAccountProfileRequestUrl(): string {
	const profileRequestUrl = new URL(ACCOUNT_PROFILE_PATHNAME, __API_URL__);

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
	const delegatedAuthRequest = readStoredDelegatedAuthRequest();

	if (
		!currentUrl ||
		!delegatedAuthRequest ||
		delegatedAuthRequest.hostOrigin !== currentUrl.origin
	) {
		return null;
	}

	const accountSessionSyncUrl = new URL(
		'/api/v1/account/authorize',
		DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL
	);
	accountSessionSyncUrl.searchParams.set(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.redirectUrl,
		createFoundryAccountSessionReturnUrl(currentUrl)
	);
	accountSessionSyncUrl.searchParams.set(
		ACCOUNT_SESSION_TOKEN_QUERY_PARAMS.hostOrigin,
		currentUrl.origin
	);
	accountSessionSyncUrl.searchParams.set(
		ACCOUNT_DELEGATED_AUTH_LAUNCH_QUERY_PARAMS.challenge,
		delegatedAuthRequest.challenge
	);
	accountSessionSyncUrl.searchParams.set(
		ACCOUNT_DELEGATED_AUTH_LAUNCH_QUERY_PARAMS.challengeMethod,
		delegatedAuthRequest.challengeMethod
	);
	accountSessionSyncUrl.searchParams.set(
		ACCOUNT_DELEGATED_AUTH_LAUNCH_QUERY_PARAMS.state,
		delegatedAuthRequest.state
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

	let delegatedConnection =
		await ensureFoundryDelegatedConnection(__API_URL__);
	const hadDelegatedConnection = Boolean(delegatedConnection?.accessToken);

	if (!delegatedConnection?.accessToken) {
		return createSignedOutSnapshot();
	}

	let retriedAfterGrantRefresh = false;

	try {
		while (true) {
			const accessToken = delegatedConnection?.accessToken;

			if (!accessToken) {
				return createSignedOutSnapshot();
			}

			const response = await globalThis.fetch(
				createAccountProfileRequestUrl(),
				{
					method: 'GET',
					credentials: 'omit',
					cache: 'no-store',
					headers: applyDelegatedAccessTokenHeaders(
						new Headers({
							accept: 'application/json'
						}),
						accessToken
					)
				}
			);
			const payload = await response.json().catch(() => null);

			if (response.status === 401) {
				if (!retriedAfterGrantRefresh) {
					retriedAfterGrantRefresh = true;
					delegatedConnection =
						await refreshStoredDelegatedConnection(__API_URL__);

					if (delegatedConnection?.accessToken) {
						continue;
					}
				}

				return createSignedOutSnapshot();
			}

			if (!response.ok) {
				const payloadError = (payload as { error?: unknown } | null)
					?.error;
				const errorMessage = normalizeOptionalText(
					typeof payloadError === 'string'
						? payloadError
						: (payloadError as { message?: unknown } | null)
								?.message
				);

				return createUnavailableSnapshot(
					errorMessage ?? `HTTP ${response.status}`
				);
			}

			return createAvailableSnapshot(payload);
		}
	} catch (error) {
		return hadDelegatedConnection
			? createUnavailableSnapshot(
					error instanceof Error ? error.message : null
				)
			: createSignedOutSnapshot();
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

	let openedWindow: Window | null = null;

	try {
		openedWindow =
			globalThis.open?.(
				url,
				'_blank',
				options.preserveOpener ? undefined : 'noopener'
			) ?? null;
	} catch {
		openedWindow = null;
	}

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

	try {
		openedWindow = globalThis.open?.('', '_blank') ?? null;
	} catch {
		openedWindow = null;
	}

	if (openedWindow) {
		try {
			openedWindow.location.assign(url);
		} catch {
			try {
				openedWindow.close();
			} catch {
				// Ignore close failures for browser-controlled popups.
			}

			return navigateCurrentPage(url);
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

interface AccountCenterLaunchOptions {
	focus: 'session' | 'connections' | 'passkeys' | 'password' | 'forge';
}

interface AccountCenterLaunchResult {
	launchUrl: string | null;
	opened: boolean;
	shouldReturnToFoundry: boolean;
}

async function createAccountCenterLaunchUrl(
	options: AccountCenterLaunchOptions
): Promise<{ launchUrl: string | null; shouldReturnToFoundry: boolean }> {
	const currentLocationUrl = readCurrentLocationUrl();
	const shouldReturnToFoundry = options.focus === 'session';
	const redirectUrl = shouldReturnToFoundry
		? currentLocationUrl
			? createFoundryAccountSessionReturnUrl(currentLocationUrl)
			: null
		: null;
	const accountCenterUrl = new URL(
		createFoundryAccountCenterUrl({
			baseUrl: DEFAULT_FOUNDRY_ACCOUNT_CENTER_BASE_URL,
			focus: options.focus,
			redirectUrl,
			hostOrigin: currentLocationUrl?.origin ?? null
		})
	);

	if (shouldReturnToFoundry && currentLocationUrl?.origin) {
		const delegatedAuthRequest = await createDelegatedAuthRequest(
			currentLocationUrl.origin
		);

		if (delegatedAuthRequest) {
			accountCenterUrl.searchParams.set(
				ACCOUNT_DELEGATED_AUTH_LAUNCH_QUERY_PARAMS.challenge,
				delegatedAuthRequest.challenge
			);
			accountCenterUrl.searchParams.set(
				ACCOUNT_DELEGATED_AUTH_LAUNCH_QUERY_PARAMS.challengeMethod,
				delegatedAuthRequest.challengeMethod
			);
			accountCenterUrl.searchParams.set(
				ACCOUNT_DELEGATED_AUTH_LAUNCH_QUERY_PARAMS.state,
				delegatedAuthRequest.state
			);
		} else {
			writeStoredDelegatedAuthRequest(null);
		}
	}

	return {
		launchUrl: accountCenterUrl.toString(),
		shouldReturnToFoundry
	};
}

async function openAccountCenter(
	options: AccountCenterLaunchOptions
): Promise<AccountCenterLaunchResult> {
	const { launchUrl, shouldReturnToFoundry } =
		await createAccountCenterLaunchUrl(options);

	return {
		launchUrl,
		opened: openExternalUrl(launchUrl, {
			preserveOpener: shouldReturnToFoundry
		}),
		shouldReturnToFoundry
	};
}

function openAccountSessionSync() {
	return openExternalUrl(createFoundryAccountSessionSyncUrl(), {
		preserveOpener: true
	});
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

	const scheduleCurrentTabAccountCenterFallback = (
		launchUrl: string | null
	) => {
		if (!launchUrl || typeof globalThis.setTimeout !== 'function') {
			return;
		}

		const expectedDelegatedAuthState =
			readStoredDelegatedAuthRequest()?.state ?? null;

		globalThis.setTimeout(() => {
			const currentLocationUrl = readCurrentLocationUrl();

			if (
				!expectsRefreshOnReturn ||
				isLoading.value ||
				snapshot.value.status === 'available' ||
				!currentLocationUrl ||
				currentLocationUrl.origin ===
					DEFAULT_FOUNDRY_ACCOUNT_CENTER_ORIGIN ||
				globalThis.document?.visibilityState === 'hidden' ||
				(typeof globalThis.document?.hasFocus === 'function' &&
					!globalThis.document.hasFocus()) ||
				Boolean(
					readStoredSnapshotToken() ||
					readStoredDelegatedConnection() ||
					readStoredDelegatedAuthorizationReturn()
				)
			) {
				return;
			}

			const currentDelegatedAuthState =
				readStoredDelegatedAuthRequest()?.state ?? null;

			if (
				expectedDelegatedAuthState &&
				currentDelegatedAuthState &&
				expectedDelegatedAuthState !== currentDelegatedAuthState
			) {
				return;
			}

			navigateCurrentPage(launchUrl);
		}, ACCOUNT_CENTER_CURRENT_TAB_FALLBACK_DELAY_MS);
	};

	const handleAccountSessionLaunchMessage = (event: MessageEvent) => {
		if (!isAllowedAccountSessionLaunchOrigin(event.origin)) {
			return;
		}

		const launchMessage = normalizeAccountSessionLaunchMessage(event.data);

		if (!launchMessage) {
			return;
		}

		const messageNotice = createAccountSessionResultNotice({
			accountSessionToken: launchMessage.accountSessionToken,
			accountAuthorizationCode: launchMessage.accountAuthorizationCode,
			accountAuthorizationState: launchMessage.accountAuthorizationState,
			redirectUrl: launchMessage.redirectUrl,
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

		startWatchingForReturn();
		void openAccountCenter({ focus: 'session' }).then(result => {
			if (result.opened) {
				if (result.shouldReturnToFoundry) {
					scheduleCurrentTabAccountCenterFallback(result.launchUrl);
				}

				return;
			}

			if (openAccountSessionSync()) {
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
		});
	};

	const openAccountSettings = () => {
		startWatchingForReturn();
		void openAccountCenter({ focus: 'connections' }).then(result => {
			if (result.opened) {
				return;
			}

			stopWatchingForReturn();
			notice.value = {
				kind: 'warning',
				message:
					'Foundry could not open the RPGM Tools account view just now.'
			};
		});
	};

	const openForgeMembership = () => {
		startWatchingForReturn();
		void openAccountCenter({ focus: 'forge' }).then(result => {
			if (result.opened) {
				return;
			}

			stopWatchingForReturn();
			notice.value = {
				kind: 'warning',
				message:
					'Foundry could not open the RPGM Tools membership view just now.'
			};
		});
	};

	const disconnectFoundrySession = () => {
		stopWatchingForReturn();
		void revokeStoredDelegatedConnection(__API_URL__);
		writeStoredSnapshotToken(null);
		writeStoredDelegatedAuthRequest(null);
		writeStoredDelegatedConnection(null);
		writeStoredDelegatedAuthorizationReturn(null);
		lastSeenSnapshotToken = null;
		snapshot.value = createSignedOutSnapshot();
		notice.value = {
			kind: 'info',
			message:
				'Disconnected this Foundry session. Your RPGM Tools web session is unchanged.'
		};
	};

	const clearNotice = () => {
		notice.value = null;
	};

	globalThis.addEventListener?.('focus', refreshIfReturnDetected);
	globalThis.addEventListener?.('message', handleAccountSessionLaunchMessage);
	globalThis.addEventListener?.('storage', event => {
		if (
			![
				FOUNDRY_PROFILE_SNAPSHOT_TOKEN_STORAGE_KEY,
				FOUNDRY_DELEGATED_CONNECTION_STORAGE_KEY,
				FOUNDRY_DELEGATED_AUTH_RETURN_STORAGE_KEY
			].includes(event.key ?? '') ||
			event.storageArea !== globalThis.localStorage
		) {
			return;
		}

		void refreshIfReturnDetected();
	});
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
			Boolean(readStoredDelegatedConnection())
		),
		refresh,
		clearNotice,
		openConnectOrCreateAccount,
		openAccountSettings,
		openForgeMembership,
		disconnectFoundrySession
	};
});
