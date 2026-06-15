import assert from 'node:assert/strict';
import test from 'node:test';

import {
	readAccountSessionReturnPayload,
	runAccountSessionReturnPage,
	resolveAccountSessionReturnUrl
} from './account-session-return.js';

function createMockWindow(
	href,
	{ withOpener = false, storageFails = false } = {}
) {
	const listeners = new Map();
	const storage = new Map();
	const opener = withOpener
		? {
				closed: false,
				focused: false,
				messages: [],
				postMessage(message, targetOrigin) {
					this.messages.push({ message, targetOrigin });
				},
				focus() {
					this.focused = true;
				}
			}
		: null;

	return {
		document: {
			body: {
				innerHTML: ''
			}
		},
		location: {
			href,
			replacedUrl: null,
			replace(url) {
				this.replacedUrl = url;
			}
		},
		localStorage: {
			getItem(key) {
				return storage.get(key) ?? null;
			},
			setItem(key, value) {
				if (storageFails) {
					throw new Error('Storage unavailable');
				}

				storage.set(key, String(value));
			},
			removeItem(key) {
				storage.delete(key);
			}
		},
		opener,
		addEventListener(type, listener) {
			listeners.set(type, listener);
		},
		setTimeout(callback) {
			this.timeoutCallback = callback;
			return 1;
		},
		listeners,
		storage
	};
}

test('reads delegated account-session return payloads', () => {
	const delegatedPayload = readAccountSessionReturnPayload(
		'https://foundry.example/modules/rpgm-forge/account-session-return.html?accountAuthorizationCode=delegated-code#accountAuthorizationState=delegated-state&redirectUrl=https%3A%2F%2Ffoundry.example%2Fgame'
	);
	assert.equal(delegatedPayload.accountSessionToken, null);
	assert.equal(delegatedPayload.accountAuthorizationCode, 'delegated-code');
	assert.equal(delegatedPayload.accountAuthorizationState, 'delegated-state');
	assert.equal(delegatedPayload.redirectUrl, 'https://foundry.example/game');
});

test('only returns to same-origin redirect targets', () => {
	assert.equal(
		resolveAccountSessionReturnUrl(
			'https://foundry.example/modules/rpgm-forge/account-session-return.html?redirectUrl=https%3A%2F%2Ffoundry.example%2Fgame%3Ffoo%3Dbar',
			'https://foundry.example/game?foo=bar'
		),
		'https://foundry.example/game?foo=bar'
	);

	assert.equal(
		resolveAccountSessionReturnUrl(
			'https://foundry.example/modules/rpgm-forge/account-session-return.html?redirectUrl=https%3A%2F%2Fevil.example%2Fpwnd',
			'https://evil.example/pwnd'
		),
		'https://foundry.example/game'
	);

	assert.equal(
		resolveAccountSessionReturnUrl(
			'https://foundry.example/modules/rpgm-forge/account-session-return.html',
			null
		),
		'https://foundry.example/game'
	);
});

test('uses hash params instead of query params for no-storage fallback payloads', () => {
	const payload = readAccountSessionReturnPayload(
		'https://foundry.example/modules/rpgm-forge/account-session-return.html#accountAuthorizationCode=delegated-code&accountAuthorizationState=delegated-state&accountSessionError=UNAUTHORIZED&accountSessionErrorDescription=Need%20sign-in&redirectUrl=https%3A%2F%2Ffoundry.example%2Fgame'
	);

	assert.equal(payload.accountAuthorizationCode, 'delegated-code');
	assert.equal(payload.accountAuthorizationState, 'delegated-state');
	assert.equal(payload.accountSessionError, 'UNAUTHORIZED');
	assert.equal(payload.redirectUrl, 'https://foundry.example/game');
});

test('stores delegated authorization returns and posts them back to the opener', () => {
	const win = createMockWindow(
		'https://foundry.example/modules/rpgm-forge/account-session-return.html?accountAuthorizationCode=delegated-code&accountAuthorizationState=delegated-state&redirectUrl=https%3A%2F%2Ffoundry.example%2Fgame',
		{ withOpener: true }
	);

	runAccountSessionReturnPage(win);

	assert.equal(
		win.localStorage.getItem(
			'rpgm.foundry.accountDelegatedAuthorizationReturn'
		),
		JSON.stringify({
			accountAuthorizationCode: 'delegated-code',
			accountAuthorizationState: 'delegated-state',
			redirectUrl: 'https://foundry.example/game'
		})
	);
	assert.deepEqual(win.opener.messages, [
		{
			message: {
				type: 'rpgm-account-session-launch-result',
				accountSessionToken: null,
				accountAuthorizationCode: 'delegated-code',
				accountAuthorizationState: 'delegated-state',
				accountSessionError: null,
				accountSessionErrorDescription: null,
				redirectUrl: 'https://foundry.example/game'
			},
			targetOrigin: 'https://foundry.example'
		}
	]);
	assert.match(
		win.document.body.innerHTML,
		/Returning control to Foundry now/u
	);

	const acknowledge = win.listeners.get('message');
	assert.equal(typeof acknowledge, 'function');
	acknowledge({
		origin: 'https://foundry.example',
		data: {
			type: 'rpgm-account-session-launch-ack'
		}
	});

	assert.equal(win.opener.focused, true);
	assert.match(win.document.body.innerHTML, /close this window/u);
	assert.equal(win.location.replacedUrl, null);
});

test('falls back to same-origin /game navigation when no opener is present', () => {
	const win = createMockWindow(
		'https://foundry.example/modules/rpgm-forge/account-session-return.html?accountAuthorizationCode=delegated-code&redirectUrl=https%3A%2F%2Fevil.example%2Fphish'
	);

	runAccountSessionReturnPage(win);

	assert.equal(
		win.localStorage.getItem(
			'rpgm.foundry.accountDelegatedAuthorizationReturn'
		),
		JSON.stringify({
			accountAuthorizationCode: 'delegated-code',
			accountAuthorizationState: null,
			redirectUrl: 'https://evil.example/phish'
		})
	);
	assert.equal(win.location.replacedUrl, 'https://foundry.example/game');
});

test('falls back to same-origin navigation with delegated return params when storage is unavailable', () => {
	const win = createMockWindow(
		'https://foundry.example/modules/rpgm-forge/account-session-return.html?accountAuthorizationCode=delegated-code&accountAuthorizationState=delegated-state&accountSessionError=UNAUTHORIZED&accountSessionErrorDescription=Need%20sign-in&redirectUrl=https%3A%2F%2Ffoundry.example%2Fgame',
		{ storageFails: true }
	);

	runAccountSessionReturnPage(win);

	assert.equal(
		win.location.replacedUrl,
		'https://foundry.example/game#accountAuthorizationCode=delegated-code&accountAuthorizationState=delegated-state&accountSessionError=UNAUTHORIZED&accountSessionErrorDescription=Need+sign-in'
	);
});

test('ignores legacy snapshot-token params instead of forwarding them through the active flow', () => {
	const payload = readAccountSessionReturnPayload(
		'https://foundry.example/modules/rpgm-forge/account-session-return.html?accountSessionToken=query-token#profileSnapshotToken=legacy-token&foundryProfileSnapshotToken=hash-token'
	);

	assert.equal(payload.accountSessionToken, null);
	assert.equal(payload.accountAuthorizationCode, null);
	assert.equal(payload.accountAuthorizationState, null);
});
