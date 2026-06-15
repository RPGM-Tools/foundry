const delegatedAuthReturnStorageKey =
	'rpgm.foundry.accountDelegatedAuthorizationReturn';
const launchMessageType = 'rpgm-account-session-launch-result';
const launchAckMessageType = 'rpgm-account-session-launch-ack';
const launchAckTimeoutMs = 1200;

function readHashParams(currentUrl) {
	const hash = currentUrl.hash.startsWith('#')
		? currentUrl.hash.slice(1)
		: currentUrl.hash;
	return new URLSearchParams(hash);
}

function readHashState(currentUrl) {
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

function readParam(currentUrl, hashParams, paramName) {
	return currentUrl.searchParams.get(paramName) || hashParams.get(paramName);
}

export function readAccountSessionReturnPayload(currentHref) {
	const currentUrl = new URL(currentHref);
	const hashParams = readHashParams(currentUrl);

	return {
		currentUrl,
		accountSessionToken: null,
		accountAuthorizationCode: readParam(
			currentUrl,
			hashParams,
			'accountAuthorizationCode'
		),
		accountAuthorizationState: readParam(
			currentUrl,
			hashParams,
			'accountAuthorizationState'
		),
		accountSessionError: readParam(
			currentUrl,
			hashParams,
			'accountSessionError'
		),
		accountSessionErrorDescription: readParam(
			currentUrl,
			hashParams,
			'accountSessionErrorDescription'
		),
		redirectUrl: readParam(currentUrl, hashParams, 'redirectUrl')
	};
}

export function resolveAccountSessionReturnUrl(currentHref, redirectUrl) {
	const currentUrl = new URL(currentHref);
	let nextUrl = new URL('/game', currentUrl.origin);

	if (!redirectUrl) {
		return nextUrl.toString();
	}

	try {
		const candidateUrl = new URL(redirectUrl, currentUrl.origin);
		if (candidateUrl.origin === currentUrl.origin) {
			nextUrl = candidateUrl;
		}
	} catch {
		// Keep the default /game fallback.
	}

	return nextUrl.toString();
}

function appendParamIfPresent(searchParams, paramName, paramValue) {
	if (paramValue) {
		searchParams.set(paramName, paramValue);
	}
}

function createAccountSessionReturnNavigationUrl(
	payload,
	{ includeReturnParamsInHash = false } = {}
) {
	const nextUrl = new URL(
		resolveAccountSessionReturnUrl(
			payload.currentUrl.toString(),
			payload.redirectUrl
		)
	);
	const { hashPath, hashParams } = readHashState(nextUrl);

	if (includeReturnParamsInHash) {
		appendParamIfPresent(
			hashParams,
			'accountAuthorizationCode',
			payload.accountAuthorizationCode
		);
		appendParamIfPresent(
			hashParams,
			'accountAuthorizationState',
			payload.accountAuthorizationState
		);
		appendParamIfPresent(
			hashParams,
			'accountSessionError',
			payload.accountSessionError
		);
		appendParamIfPresent(
			hashParams,
			'accountSessionErrorDescription',
			payload.accountSessionErrorDescription
		);
	}

	const nextHashQuery = hashParams.toString();
	nextUrl.hash = hashPath
		? nextHashQuery
			? `${hashPath}?${nextHashQuery}`
			: hashPath
		: nextHashQuery;

	return nextUrl.toString();
}

function persistAccountSessionReturnPayload(win, payload) {
	if (payload.accountAuthorizationCode) {
		win.localStorage.setItem(
			delegatedAuthReturnStorageKey,
			JSON.stringify({
				accountAuthorizationCode: payload.accountAuthorizationCode,
				accountAuthorizationState: payload.accountAuthorizationState,
				redirectUrl: payload.redirectUrl
			})
		);
	}
}

function showStatus(doc, message) {
	doc.body.innerHTML = [
		'<main style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;max-width:560px;margin:0 auto;line-height:1.5;color:#f5f5f5;background:#111827;min-height:100vh;box-sizing:border-box;">',
		'<h1 style="font-size:1.25rem;margin:0 0 12px;">RPGM Tools account connected</h1>',
		`<p style="margin:0;">${message}</p>`,
		'</main>'
	].join('');
}

export function runAccountSessionReturnPage(win) {
	const payload = readAccountSessionReturnPayload(win.location.href);
	const launchMessage = {
		type: launchMessageType,
		accountSessionToken: payload.accountSessionToken,
		accountAuthorizationCode: payload.accountAuthorizationCode,
		accountAuthorizationState: payload.accountAuthorizationState,
		accountSessionError: payload.accountSessionError,
		accountSessionErrorDescription: payload.accountSessionErrorDescription,
		redirectUrl: payload.redirectUrl
	};
	let shouldPersistBridgeReturnViaHash = false;

	try {
		persistAccountSessionReturnPayload(win, payload);
	} catch {
		shouldPersistBridgeReturnViaHash = true;
	}

	const nextUrl = createAccountSessionReturnNavigationUrl(payload, {
		includeReturnParamsInHash: shouldPersistBridgeReturnViaHash
	});

	if (win.opener && !win.opener.closed) {
		try {
			let hasAcknowledgedLaunch = false;
			const finishWithNavigationFallback = () => {
				if (hasAcknowledgedLaunch) {
					return;
				}

				win.location.replace(nextUrl);
			};

			win.opener.postMessage(launchMessage, payload.currentUrl.origin);
			win.setTimeout(finishWithNavigationFallback, launchAckTimeoutMs);
			win.addEventListener('message', event => {
				if (event.origin !== payload.currentUrl.origin) {
					return;
				}

				if (event.data?.type !== launchAckMessageType) {
					return;
				}

				hasAcknowledgedLaunch = true;

				try {
					win.opener.focus();
				} catch {
					// Ignore focus failures.
				}

				showStatus(
					win.document,
					'Sign-in finished. You can return to Foundry and close this window.'
				);
			});
			showStatus(
				win.document,
				'Sign-in finished. Returning control to Foundry now. If this window stays open, you can close it safely.'
			);
			return;
		} catch {
			// Fall through to same-tab navigation if the opener bridge cannot respond.
		}
	}

	win.location.replace(nextUrl);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
	runAccountSessionReturnPage(window);
}
