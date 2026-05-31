/**
 * File: client/index.ts
 * Purpose: Local minimal shared API client surface for the legacy Foundry
 *          runtime so old Forge no longer depends on the legacy `@rpgm/tools`
 *          package for this helper layer.
 * Last Updated: 2026-05-31
 */

type RpgmApiSecurity = {
	in?: 'cookie' | 'header' | 'query';
	name?: string;
	scheme?: string;
	type?: string;
};

type RpgmApiClientConfig = {
	auth?:
		| string
		| ((
				security: RpgmApiSecurity
		  ) =>
				| Promise<string | undefined>
				| string
				| undefined);
	baseUrl?: string;
	fetch?: typeof fetch;
	headers?: HeadersInit;
};

type RpgmApiRequestOptions<TQuery extends Record<string, unknown> | undefined> =
	{
		headers?: HeadersInit;
		query?: TQuery;
		security?: readonly RpgmApiSecurity[];
		url: string;
	};

type RpgmApiResponseFields<TData, TError = unknown> = {
	data: TData | undefined;
	error: TError | undefined;
	request: Request;
	response: Response;
};

export type RpgmProduct = {
	description: string | null;
	id: string;
	isRecurring?: boolean;
	medias: Array<{
		publicUrl?: string;
		size?: number;
	}>;
	metadata: Record<string, unknown>;
	name: string;
	prices: Record<string, unknown>;
	slug: string;
};

export type RpgmUserInfo = {
	sigils: Array<{
		aura: string;
		description: string;
		id: string;
		imageUrl: string;
		name: string;
	}>;
	tier: {
		id: string;
		name: string | null;
	};
};

class InterceptorRegistry<TValue> {
	private readonly interceptors: Array<
		(value: TValue) => Promise<TValue> | TValue
	> = [];

	use(interceptor: (value: TValue) => Promise<TValue> | TValue) {
		this.interceptors.push(interceptor);
		return this.interceptors.length - 1;
	}

	async run(value: TValue) {
		let currentValue = value;

		for (const interceptor of this.interceptors) {
			currentValue = await interceptor(currentValue);
		}

		return currentValue;
	}
}

function mergeHeaders(...headerSets: Array<HeadersInit | undefined>) {
	const mergedHeaders = new Headers();

	for (const headerSet of headerSets) {
		if (!headerSet) {
			continue;
		}

		const headerEntries =
			headerSet instanceof Headers
				? Array.from(headerSet.entries())
				: Array.isArray(headerSet)
					? headerSet
					: Object.entries(headerSet);

		for (const [key, value] of headerEntries) {
			if (value === undefined) {
				continue;
			}

			mergedHeaders.set(key, String(value));
		}
	}

	return mergedHeaders;
}

function buildUrl(
	baseUrl: string | undefined,
	urlPath: string,
	query?: Record<string, unknown>
) {
	const requestUrl = new URL(urlPath, baseUrl);

	for (const [key, value] of Object.entries(query ?? {})) {
		if (value === undefined || value === null) {
			continue;
		}

		if (Array.isArray(value)) {
			for (const item of value) {
				requestUrl.searchParams.append(key, String(item));
			}
			continue;
		}

		requestUrl.searchParams.set(key, String(value));
	}

	return requestUrl;
}

async function parseResponseBody(response: Response) {
	if (response.status === 204) {
		return undefined;
	}

	const responseContentType = response.headers.get('content-type') ?? '';

	if (responseContentType.includes('application/json')) {
		return response.json();
	}

	if (responseContentType.startsWith('text/')) {
		return response.text();
	}

	return response.arrayBuffer();
}

class RpgmApiClient {
	private config: RpgmApiClientConfig = {
		fetch: globalThis.fetch?.bind(globalThis)
	};

	readonly interceptors = {
		request: new InterceptorRegistry<Request>()
	};

	getConfig() {
		return this.config;
	}

	setConfig(config: RpgmApiClientConfig) {
		this.config = {
			...this.config,
			...config,
			headers: mergeHeaders(this.config.headers, config.headers)
		};

		return this.config;
	}

	get<TData, TError = unknown, TQuery extends Record<string, unknown> | undefined = undefined>(
		options: RpgmApiRequestOptions<TQuery>
	) {
		return this.request<TData, TError, TQuery>('GET', options);
	}

	private async applySecurity(
		requestHeaders: Headers,
		security: readonly RpgmApiSecurity[] | undefined,
		requestQuery: Record<string, unknown> | undefined
	) {
		if (!security?.length || !this.config.auth) {
			return;
		}

		for (const securityRule of security) {
			const resolvedAuth =
				typeof this.config.auth === 'function'
					? await this.config.auth(securityRule)
					: this.config.auth;

			if (!resolvedAuth) {
				continue;
			}

			const authName = securityRule.name ?? 'Authorization';
			const authValue =
				securityRule.type === 'http' && securityRule.scheme === 'bearer'
					? resolvedAuth.startsWith('Bearer ')
						? resolvedAuth
						: `Bearer ${resolvedAuth}`
					: resolvedAuth;

			switch (securityRule.in) {
				case 'query':
					if (requestQuery) {
						requestQuery[authName] = authValue;
					}
					break;
				case 'cookie':
					requestHeaders.append('Cookie', `${authName}=${authValue}`);
					break;
				case 'header':
				default:
					requestHeaders.set(authName, authValue);
			}
		}
	}

	private async request<
		TData,
		TError = unknown,
		TQuery extends Record<string, unknown> | undefined = undefined
	>(
		method: 'GET',
		options: RpgmApiRequestOptions<TQuery>
	): Promise<RpgmApiResponseFields<TData, TError>> {
		const requestQuery = options.query
			? { ...options.query }
			: undefined;
		const requestHeaders = mergeHeaders(this.config.headers, options.headers);

		await this.applySecurity(requestHeaders, options.security, requestQuery);

		let request = new Request(
			buildUrl(this.config.baseUrl, options.url, requestQuery).href,
			{
				headers: requestHeaders,
				method
			}
		);

		request = await this.interceptors.request.run(request);

		const requestFetch = this.config.fetch ?? globalThis.fetch?.bind(globalThis);

		if (!requestFetch) {
			throw new Error('Fetch is unavailable for the local RPGM API client.');
		}

		const response = await requestFetch(request);
		const responseBody = await parseResponseBody(response);

		if (response.ok) {
			return {
				data: responseBody as TData,
				error: undefined,
				request,
				response
			};
		}

		return {
			data: undefined,
			error: responseBody as TError,
			request,
			response
		};
	}
}

export const client = new RpgmApiClient();

const BEARER_SECURITY = {
	scheme: 'bearer',
	type: 'http'
} as const satisfies RpgmApiSecurity;

export function getApiListProducts(
	options: Omit<
		RpgmApiRequestOptions<{ 'skip-cache'?: boolean }>,
		'url'
	> = {}
) {
	return client.get<RpgmProduct[], never, { 'skip-cache'?: boolean }>({
		url: '/api/list-products',
		...options
	});
}

export function getApiPolyhedrium(
	options: Omit<RpgmApiRequestOptions<undefined>, 'url' | 'security'> = {}
) {
	return client.get<number>({
		url: '/api/polyhedrium',
		security: [BEARER_SECURITY],
		...options
	});
}

export function getApiUserInfo(
	options: Omit<RpgmApiRequestOptions<undefined>, 'url' | 'security'> = {}
) {
	return client.get<RpgmUserInfo>({
		url: '/api/user-info',
		security: [BEARER_SECURITY],
		...options
	});
}
