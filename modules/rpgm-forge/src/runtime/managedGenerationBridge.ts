import {
	ACCOUNT_SESSION_TOKEN_HEADER_NAME,
	readStoredFoundryAccountSessionToken
} from '#/auth/accountBridge';
import {
	toRequestedModel,
	type Description,
	type DescriptionsOptions,
	type Homebrew,
	type HomebrewField,
	type HomebrewOptions,
	type HomebrewSchema,
	type Names,
	type NamesOptions
} from '#/forgeCompat';

import type { RpgmForge } from '$/forge';

function createManagedRequestHeaders(): Headers {
	const headers = new Headers({
		accept: 'application/json',
		'content-type': 'application/json; charset=utf-8'
	});
	const snapshotToken = readStoredFoundryAccountSessionToken();

	if (snapshotToken) {
		headers.set(ACCOUNT_SESSION_TOKEN_HEADER_NAME, snapshotToken);
	}

	return headers;
}

function normalizeOptionalText(value?: string | null): string | undefined {
	const normalizedValue = value?.trim();

	return normalizedValue ? normalizedValue : undefined;
}

function createFieldKey(name: string): string {
	const normalizedName = name
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/gu, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/gu, '');

	return normalizedName || 'field';
}

function getManagedResponsesUrls(): string[] {
	return ['/api/v1/forge/responses', '/api/forge/responses'].map(pathname =>
		new URL(pathname, __API_URL__).toString()
	);
}

export interface LegacyFoundryManagedGenerationBridge {
	generateNames(options: NamesOptions): Promise<Names>;
	generateDescriptions(options: DescriptionsOptions): Promise<Description>;
	generateHomebrew(options: HomebrewOptions): Promise<Homebrew>;
}

export interface CreateLegacyFoundryManagedGenerationBridgeInput {
	forge: RpgmForge;
}

interface ForgeManagedResponseChoice {
	message?: {
		content?: string | null;
	};
}

interface ForgeManagedResponsesEnvelope {
	response?: {
		choices?: ForgeManagedResponseChoice[];
	};
	error?: {
		message?: string;
	};
}

function readManagedResponseText(
	payload: ForgeManagedResponsesEnvelope
): string {
	const content = payload.response?.choices?.[0]?.message?.content;

	if (typeof content !== 'string' || !content.trim()) {
		throw new Error('Steward returned an empty Forge response.');
	}

	return content.trim();
}

async function postManagedResponse(input: {
	lane: 'names' | 'descriptions' | 'homebrew';
	requestedModel?: string;
	messages: Array<{ role: 'system' | 'user'; content: string }>;
	responseFormat?: {
		type: 'text' | 'json-object' | 'json-schema';
		name?: string;
		schema?: Record<string, unknown>;
		strict?: boolean;
	};
	temperature?: number;
	topP?: number;
	presencePenalty?: number;
	frequencyPenalty?: number;
}): Promise<ForgeManagedResponsesEnvelope> {
	let lastError: Error | null = null;

	for (const requestUrl of getManagedResponsesUrls()) {
		try {
			const response = await globalThis.fetch(requestUrl, {
				method: 'POST',
				cache: 'no-store',
				credentials: 'include',
				headers: createManagedRequestHeaders(),
				body: JSON.stringify({
					lane: input.lane,
					requestedModel: input.requestedModel,
					messages: input.messages,
					responseFormat: input.responseFormat,
					temperature: input.temperature,
					topP: input.topP,
					presencePenalty: input.presencePenalty,
					frequencyPenalty: input.frequencyPenalty,
					metadata: {
						surface: 'old-foundry-managed-bridge'
					}
				})
			});
			const payload = (await response
				.json()
				.catch(() => null)) as ForgeManagedResponsesEnvelope | null;

			if (!response.ok) {
				lastError = new Error(
					payload?.error?.message ??
						`Forge managed response failed with HTTP ${response.status}.`
				);

				if (response.status === 404) {
					continue;
				}

				throw lastError;
			}

			if (!payload) {
				lastError = new Error(
					'Forge managed response returned no JSON payload.'
				);
				continue;
			}

			return payload;
		} catch (error) {
			lastError =
				error instanceof Error
					? error
					: new Error(
							'Failed to reach the managed Forge response lane.'
						);
		}
	}

	throw (
		lastError ??
		new Error('Failed to reach the managed Forge response lane.')
	);
}

function buildNamesUserMessage(options: NamesOptions): string {
	return `${JSON.stringify(
		{
			task: 'generate_names',
			quantity: options.quantity,
			type: options.type,
			genre: options.genre,
			language: normalizeOptionalText(options.language) ?? null,
			gender: options.gender
		},
		null,
		2
	)}\n\nRespond with exactly ${options.quantity} unique name(s), one per line, with no numbering, bullets, or commentary.`;
}

function buildDescriptionPrompt(options: DescriptionsOptions): string {
	let prompt = '';
	prompt += `I would like a description for a(n) {${options.type.toLowerCase()}}.\n`;

	if (options.language) {
		prompt += `Generate everything in the {${options.language}} language.\n`;
	}

	switch (options.length) {
		case 'short':
			prompt +=
				'The description should be a short blurb, up to 4 sentences.\n';
			break;
		case 'medium':
			prompt +=
				'The description should be short, up to 2 paragraphs of ~4 sentences each.\n';
			break;
		case 'extensive':
			prompt +=
				'The description should be long and detailed, up to 4 paragraphs of ~4 sentences each.\n';
			break;
	}

	prompt += `Create the description in the {${options.genre}} genre.\n`;
	prompt += options.system
		? `Make sure your description is compatible with {${options.system}} (a TTRPG system)\n`
		: `Make sure your description isn't tied to a specific system (e.g. Dungeons & Dragons or Pathfinder)\n`;
	prompt += options.name
		? `The name of it is {${options.name}}\n`
		: 'Come up with your own name for it!\n';

	if (options.notes) {
		prompt += `Here are some additional notes:\n{${options.notes}}`;
	}

	return prompt;
}

function buildHomebrewResponseSchema(
	schema: HomebrewSchema
): Record<string, unknown> {
	return {
		type: 'object',
		additionalProperties: false,
		required: ['name', 'flavor_text', 'fields'],
		properties: {
			name: {
				type: 'string',
				description:
					'The display name for the generated homebrew result.'
			},
			flavor_text: {
				type: 'string',
				description:
					'A short subtitle or flavor line shown below the title.'
			},
			fields: {
				type: 'object',
				additionalProperties: false,
				required: schema.fields.map(field =>
					createFieldKey(field.name)
				),
				properties: Object.fromEntries(
					schema.fields.map(field => [
						createFieldKey(field.name),
						{
							type:
								field.type === 'short' || field.type === 'long'
									? 'string'
									: field.type,
							description: field.description
						}
					])
				)
			}
		}
	};
}

function mapGeneratedHomebrewFieldValue(input: {
	field: HomebrewField;
	generatedFields: Record<string, string | number | boolean>;
}): HomebrewField {
	const value = input.generatedFields[createFieldKey(input.field.name)];

	if (value === undefined) {
		throw new Error(
			`Generated homebrew is missing the required field "${input.field.name}".`
		);
	}

	switch (input.field.type) {
		case 'boolean':
			if (typeof value !== 'boolean') {
				throw new Error(
					`Field "${input.field.name}" must be a boolean.`
				);
			}

			return {
				...input.field,
				value
			};
		case 'number':
			if (typeof value !== 'number') {
				throw new Error(
					`Field "${input.field.name}" must be a number.`
				);
			}

			return {
				...input.field,
				value
			};
		case 'short':
		case 'long':
			if (typeof value !== 'string') {
				throw new Error(
					`Field "${input.field.name}" must be a string.`
				);
			}

			return {
				...input.field,
				value
			};
	}
}

function buildHomebrewPrompt(options: HomebrewOptions): string {
	return [
		`Generate a(n) {${options.schema.name}} in json format.`,
		...(options.language
			? [`Generate everything in the {${options.language}} language`]
			: []),
		options.schema.custom_name
			? `The name of the thing being generated is {${options.schema.custom_name}}`
			: `Generate the name for the {${options.schema.name}}`,
		options.system
			? `Make sure your {${options.schema.name}} is compatible with {${options.system}} (a TTRPG system)`
			: `Make sure your {${options.schema.name}} isn't tied to a specific system (e.g. Dungeons & Dragons or Pathfinder)`,
		options.genre
			? `Create the ${options.schema.name} in the {${options.genre}} genre`
			: '',
		'Fields:\n',
		options.schema.fields
			.map(field => {
				const value =
					field.value === undefined || field.value === false
						? '{generate}'
						: `"${field.value}"`;

				return `"${field.name}": (${field.type}) = ${value}`;
			})
			.join('\n')
	].join('\n');
}

export function createLegacyFoundryManagedGenerationBridge(
	input: CreateLegacyFoundryManagedGenerationBridgeInput
): LegacyFoundryManagedGenerationBridge {
	return {
		async generateNames(options) {
			const payload = await postManagedResponse({
				lane: 'names',
				requestedModel: toRequestedModel(
					input.forge.settings.get('namesModel')
				),
				messages: [
					{
						role: 'system',
						content: `You are NAMESMITH, an autonomous naming micro-service for tabletop roleplaying games.\n\nFollow EVERY rule precisely:\n\n1. The user supplies JSON instructions. Parse them literally. Fields include task, quantity, genre, language, gender, and type.\n2. Output exactly the requested number of names. One name per line. No numbering, bullets, or blank lines.\n3. Keep names distinctive, novel, and fitting for the requested genre and type.\n4. No apologies, explanations, or commentary. Output the names only.`
					},
					{
						role: 'user',
						content: buildNamesUserMessage(options)
					}
				],
				temperature: 0.9,
				topP: 0.9,
				presencePenalty: 0.7,
				frequencyPenalty: 0.65
			});
			const names = readManagedResponseText(payload)
				.split('\n')
				.map(name => name.trim())
				.filter(Boolean);

			if (!names.length) {
				throw new Error('Failed to generate names.');
			}

			return {
				names
			};
		},
		async generateDescriptions(options) {
			const payload = await postManagedResponse({
				lane: 'descriptions',
				requestedModel: toRequestedModel(
					input.forge.settings.get('descriptionsModel')
				),
				messages: [
					{
						role: 'system',
						content: `You are QUILLFORGE, an automated description-forge for elements of fictional worlds.\n\nFollow the user's requested type, name, genre, length, language, system-compatibility guidance, and notes. Return only plain prose with no markdown or commentary.`
					},
					{
						role: 'user',
						content: buildDescriptionPrompt(options)
					}
				]
			});

			return {
				description: readManagedResponseText(payload)
			};
		},
		async generateHomebrew(options) {
			const payload = await postManagedResponse({
				lane: 'homebrew',
				requestedModel: toRequestedModel(
					input.forge.settings.get('homebrewModel')
				),
				messages: [
					{
						role: 'system',
						content: `You are QUILLFORGE, an automated homebrew-forge for elements of fictional worlds.\n\nReturn only valid JSON matching the provided schema. Keep the generated result flavorful, system-compatible when requested, and focused on the requested schema fields.`
					},
					{
						role: 'user',
						content: buildHomebrewPrompt(options)
					}
				],
				responseFormat: {
					type: 'json-schema',
					name: createFieldKey(options.schema.name),
					schema: buildHomebrewResponseSchema(options.schema),
					strict: true
				}
			});
			const content = readManagedResponseText(payload);
			const generated = JSON.parse(content) as {
				name?: string;
				flavor_text?: string;
				fields?: Record<string, string | number | boolean>;
			};
			const generatedName = normalizeOptionalText(generated.name);
			const generatedFlavorText = normalizeOptionalText(
				generated.flavor_text
			);

			if (!generatedFlavorText || !generated.fields) {
				throw new Error('Failed to generate homebrew.');
			}

			return {
				name: options.schema.name,
				custom_name:
					options.schema.custom_name ??
					generatedName ??
					(() => {
						throw new Error(
							'Generated homebrew is missing a name.'
						);
					})(),
				flavor_text: generatedFlavorText,
				fields: options.schema.fields.map(field => {
					return mapGeneratedHomebrewFieldValue({
						field,
						generatedFields: generated.fields ?? {}
					});
				})
			};
		}
	};
}
