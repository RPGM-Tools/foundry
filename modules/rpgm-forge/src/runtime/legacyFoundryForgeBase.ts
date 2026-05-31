/**
 * File: legacyFoundryForgeBase.ts
 * Purpose: Preserve the minimal legacy Forge runtime surface Old Forge still
 *          needs locally so the module can drop its direct
 *          `@rpgm/tools/forge` dependency.
 * Last Updated: 2026-05-31
 */
import {
	RpgmLogger,
	type AbstractRpgmModule,
	type IRpgmModule,
	type TextProvider
} from '@rpgm/tools';
import { AbstractRpgmModule as AbstractRpgmModuleValue } from '../../../../node_modules/@rpgm/tools/dist/shared/src/module.js';
import {
	generateObject,
	generateText,
	jsonSchema,
	type JSONSchema7
} from 'ai';
import {
	err,
	errAsync,
	ok,
	ResultAsync,
	type Result
} from 'neverthrow';
import slugify from 'slugify';

import {
	type Description,
	type DescriptionsOptions,
	type Gender,
	type Homebrew,
	type HomebrewField,
	type HomebrewOptions,
	type Names,
	type NamesOptions,
	RPGM_MODELS,
	type TextModel
} from '#/forgeCompat';

export type LegacyFoundryForgeSettings =
	AbstractRpgmModule.ModuleSettings & {
		namesModel: TextModel;
		descriptionsModel: TextModel;
		homebrewModel: TextModel;
	};

type QueueOptions = Partial<{
	autoDone: boolean;
}>;

type QueueItem<T = any, E = any> = {
	item: (done: () => void) => PromiseLike<Result<T, E>>;
	cb: (result: Result<T, E>) => void;
	options: QueueOptions;
};

class LegacyForgeQueue {
	private queue: QueueItem<any, any>[] = [];
	private processing = 0;
	private readonly maxConcurrency: number;

	constructor(maxConcurrency = 1) {
		this.maxConcurrency = maxConcurrency;
	}

	generate<R, E>(
		item: (done: () => void) => PromiseLike<Result<R, E>>,
		options: QueueOptions = {
			autoDone: true
		}
	) {
		options.autoDone ??= true;
		return new ResultAsync<R, E>(
			new Promise<Result<R, E>>(cb => {
				this.queue.push({ item, cb, options });
				this.process();
			})
		);
	}

	private async process() {
		while (
			this.queue.length > 0 &&
			this.processing < this.maxConcurrency
		) {
			this.processing++;
			let doneCalled = false;
			const { item, cb, options } = this.queue.shift()!;
			const done = () => {
				if (doneCalled) {
					return;
				}

				doneCalled = true;
				this.processing--;
				this.process();
			};

			item(done).then(
				result => {
					cb(result);
					if (options.autoDone) {
						done();
					}
				},
				error => {
					cb(err(error));
					if (options.autoDone) {
						done();
					}
				}
			);
		}
	}
}

type OfflineName = {
	type: string;
	text: string;
	gender: Gender;
	weight: number;
	position: 'first' | 'last';
};

type OfflineNameType = {
	id: string;
	text: string;
};

type NamesData = {
	types: { id: string; text: string }[];
	names: {
		type: string;
		text: string;
		gender: Gender;
		weight: number;
		position: 'first' | 'last';
	}[];
};

type HomebrewResponse = {
	name: string;
	flavor_text: string;
	fields: { [key: string]: string | number | boolean };
};

let offlineNamesData: {
	names: OfflineName[];
	types: OfflineNameType[];
};

const offlineNameIndex: Map<
	string,
	{ first: OfflineName[]; last: OfflineName[] }
> = new Map();

const globalOfflineNames = {
	first: [] as OfflineName[],
	last: [] as OfflineName[]
};

let adjectiveDictionary: string[] | null = null;
let namesPromptDictionary: NamesData | null = null;
const recentAdjectives: string[] = [];
const RECENT_ADJECTIVE_LIMIT = 100;

function pickWeightedNames(pool: OfflineName[], count: number) {
	let totalWeight = 0;
	for (const name of pool) {
		totalWeight += name.weight;
	}

	const result: OfflineName[] = [];

	for (let index = 0; index < count; index++) {
		let random = Math.random() * totalWeight;
		let tries = 0;

		for (const name of pool) {
			random -= name.weight;
			if (random < name.weight) {
				if (
					result.some(existing => existing.text === name.text) &&
					tries++ < 10
				) {
					continue;
				}

				result.push(name);
				break;
			}
		}
	}

	return result;
}

async function ensureOfflineNamesLoaded() {
	if (offlineNamesData) {
		return;
	}

	offlineNamesData = (
		await import(
			'../../../../node_modules/@rpgm/tools/dist/tools/forge/data/names-list.json'
		)
	)
		.default as typeof offlineNamesData;

	for (const name of offlineNamesData.names) {
		const bucket =
			offlineNameIndex.get(name.type) ??
			offlineNameIndex
				.set(name.type, { first: [], last: [] })
				.get(name.type)!;

		bucket[name.position].push(name);
		globalOfflineNames[name.position].push(name);
	}
}

function generateOfflineNames(options: NamesOptions): ResultAsync<Names, Error> {
	return ResultAsync.fromPromise(
		(async () => {
			await ensureOfflineNamesLoaded();

			const requestedType = options.type.toLowerCase();
			const typeMatches =
				offlineNameIndex.get(requestedType)?.first ?? [];
			let candidateNames =
				typeMatches.length > 0 ? typeMatches : globalOfflineNames.first;

			if (options.gender) {
				const genderMatches = candidateNames.filter(
					candidate => candidate.gender === options.gender
				);

				if (genderMatches.length > 0) {
					candidateNames = genderMatches;
				}
			}

			return {
				names: pickWeightedNames(candidateNames, options.quantity).map(
					name => name.text
				)
			};
		})(),
		() => new Error('Offline data could not be loaded')
	);
}

async function ensureAdjectivesLoaded() {
	if (!adjectiveDictionary) {
		adjectiveDictionary = (
			await import(
				'../../../../node_modules/@rpgm/tools/dist/tools/forge/data/adjectives-list.json'
			)
		).default.adjectives as string[];
	}
}

function pickUniqueAdjectives(count: number): string[] {
	if (!adjectiveDictionary) {
		return [];
	}

	const result: string[] = [];
	let attempts = 0;

	while (result.length < count && attempts < count * 25) {
		attempts++;
		const adjective =
			adjectiveDictionary[
				Math.floor(Math.random() * adjectiveDictionary.length)
			];

		if (result.includes(adjective)) {
			continue;
		}

		if (
			recentAdjectives.includes(adjective) &&
			Math.random() < 0.7
		) {
			continue;
		}

		result.push(adjective);
	}

	for (const adjective of result) {
		recentAdjectives.push(adjective);
		if (recentAdjectives.length > RECENT_ADJECTIVE_LIMIT) {
			recentAdjectives.shift();
		}
	}

	return result;
}

function generateAdjectiveNames(
	options: NamesOptions
): ResultAsync<Names, Error> {
	return ResultAsync.fromPromise(
		(async () => {
			await ensureAdjectivesLoaded();
			const baseType = options.type.trim();

			if (!baseType) {
				return { names: [] } as Names;
			}

			const adjectives = pickUniqueAdjectives(options.quantity || 1);
			return {
				names: adjectives.map(adjective => `${adjective} ${baseType}`)
			} as Names;
		})(),
		() => new Error('Adjectives data could not be loaded')
	);
}

async function ensureNamesPromptDictionariesLoaded() {
	if (!adjectiveDictionary) {
		await ensureAdjectivesLoaded();
	}

	if (!namesPromptDictionary) {
		namesPromptDictionary = (
			await import(
				'../../../../node_modules/@rpgm/tools/dist/tools/forge/data/names-list.json'
			)
		).default as NamesData;
	}
}

function pickRandomUnique<T>(source: T[], count: number) {
	if (!source.length || count <= 0) {
		return [] as T[];
	}

	const pool = [...source];
	const result: T[] = [];

	while (result.length < count && pool.length) {
		const index = Math.floor(Math.random() * pool.length);
		result.push(pool.splice(index, 1)[0]!);
	}

	return result;
}

function pickRandomPromptAdjectives(count: number) {
	if (!adjectiveDictionary?.length) {
		return [] as string[];
	}

	return pickRandomUnique(adjectiveDictionary, Math.max(1, count));
}

function pickNameExamples(count: number) {
	if (!namesPromptDictionary?.names?.length) {
		return [] as { type: string; name: string }[];
	}

	const comparableNames = namesPromptDictionary.names.filter(
		name => name.position === 'first'
	);

	if (!comparableNames.length) {
		return [];
	}

	const groupedNames = comparableNames.reduce<Record<string, string[]>>(
		(accumulator, name) => {
			(accumulator[name.type] ||= []).push(name.text);
			return accumulator;
		},
		{}
	);

	const typeIds = Object.keys(groupedNames);
	const pickedTypes = pickRandomUnique(
		typeIds,
		Math.min(typeIds.length, Math.max(1, count))
	);

	return pickedTypes.map(type => {
		const pool = groupedNames[type]!;
		return {
			type,
			name: pool[Math.floor(Math.random() * pool.length)]
		};
	});
}

function buildSubjects(baseType: string, adjectives: string[]) {
	const safeBaseType = baseType.trim() || 'creature';

	if (!adjectives.length) {
		return [{ adjective: null as string | null, subject: safeBaseType }];
	}

	return adjectives.map(adjective => ({
		adjective,
		subject: `${adjective} ${safeBaseType}`
	}));
}

function buildNamesInstruction(
	options: NamesOptions,
	adjectives: string[],
	examples: { type: string; name: string }[]
) {
	const subjects = buildSubjects(options.type, adjectives);

	return {
		task: 'generate_names',
		quantity: options.quantity,
		genre: options.genre,
		language: options.language || null,
		gender: options.gender,
		subjects: subjects.map(({ adjective, subject }) => ({
			base: options.type,
			descriptor: adjective,
			subject
		})),
		examples: examples.map(example => ({
			type: example.type,
			name: example.name
		})),
		constraints: {
			outputLines: options.quantity,
			allowCharacters: ["'", '-'],
			disallowExamples: examples.map(example => example.name)
		}
	};
}

function buildNamesUserMessage(
	options: NamesOptions,
	instruction: ReturnType<typeof buildNamesInstruction>
) {
	const payload = JSON.stringify(instruction, null, 2);
	return `${payload}\n\nRespond with exactly ${options.quantity} unique name(s) in the same order as the subjects list. Output one name per line with no numbering, no bullets, and no additional commentary. Do not reuse example names or repeat the same leading word across different results.`;
}

function generateLegacyNames(
	this: LegacyFoundryForgeBase,
	options: NamesOptions
): ResultAsync<Names, Error> {
	const provider = this.settings.get('namesModel')?.provider;

	if (provider === RPGM_MODELS.offlineNames.provider) {
		return generateOfflineNames(options);
	}

	if (provider === RPGM_MODELS.adjectiveNames.provider) {
		return generateAdjectiveNames(options);
	}

	const namesModel = this.settings.get('namesModel');
	if (!namesModel) {
		return errAsync(new Error('No names model configured.'));
	}

	const model = this.tools.textAiFromModel.call(this.tools, namesModel);
	if (model.isErr()) {
		return errAsync(model.error);
	}

	return this.queue.generate(async () => {
		await ensureNamesPromptDictionariesLoaded();
		const adjectives = pickRandomPromptAdjectives(options.quantity);
		const examples = pickNameExamples(
			Math.min(4, Math.max(1, options.quantity))
		);
		const instruction = buildNamesInstruction(options, adjectives, examples);
		const userMessage = buildNamesUserMessage(options, instruction);

		return generateText({
			model: model.value,
			maxRetries: 0,
			temperature: 0.9,
			topP: 0.9,
			presencePenalty: 0.7,
			frequencyPenalty: 0.65,
			messages: [
				{
					role: 'system',
					content: NAMES_DEV_PROMPT
				},
				{
					role: 'user',
					content: userMessage
				}
			]
		}).then(
			({ text }: { text: string }) =>
				Promise.resolve(
					text
						.split('\n')
						.map((segment: string) => segment.trim())
						.filter(Boolean)
				).then(names =>
					names.length
						? ok({ names } as Names)
						: err(new Error('Failed to generate names.'))
				),
			(error: unknown) =>
				err(
					error instanceof Error
						? error
						: new Error('Failed to generate names.')
				)
		);
	});
}

function buildDescriptionPrompt(options: DescriptionsOptions): string {
	let prompt = '';
	prompt += `I would like a description for a(n) {${options.type.toLowerCase()}}.\n`;

	if (options.language) {
		prompt += `Generate everything in the {${options.language}} language.\n`;
	}

	switch (options.length) {
		case 'short':
			prompt += 'The description should be a short blurb, up to 4 sentences.\n';
			break;
		case 'medium':
			prompt += 'The description should be short, up to 2 paragraphs of ~4 sentences each.\n';
			break;
		case 'extensive':
			prompt += 'The description should be long and detailed, up to 4 paragraphs of ~4 sentences each.\n';
			break;
	}

	prompt += `Create the description in the {${options.genre}} genre.\n`;

	if (options.system) {
		prompt += `Make sure your description is compatible with {${options.system}} (a TTRPG system)\n`;
	} else {
		prompt += `Make sure your description isn't tied to a specific system (e.g. Dungeons & Dragons or Pathfinder)\n`;
	}

	if (options.name) {
		prompt += `The name of it is {${options.name}}\n`;
	} else {
		prompt += 'Come up with your own name for it!\n';
	}

	if (options.notes) {
		prompt += `Here are some additional notes: \n{${options.notes}}`;
	}

	return prompt;
}

function generateLegacyDescriptions(
	this: LegacyFoundryForgeBase,
	options: DescriptionsOptions
): ResultAsync<Description, Error> {
	const descriptionsModel = this.settings.get('descriptionsModel');
	if (!descriptionsModel) {
		return errAsync(new Error('No descriptions model configured.'));
	}

	const model = this.tools.textAiFromModel.call(this.tools, descriptionsModel);
	if (model.isErr()) {
		return errAsync(model.error);
	}

	return this.queue.generate(async () => {
		return generateText({
			model: model.value,
			maxRetries: 0,
			messages: [
				{
					role: 'system',
					content: DESCRIPTIONS_DEV_PROMPT
				},
				{
					role: 'user',
					content: buildDescriptionPrompt(options)
				}
			]
		}).then(
			(response: { text: string }) =>
				ok({ description: response.text } as Description),
			(error: unknown) =>
				err(
					error instanceof Error
						? error
						: new Error('Failed to generate description.')
				)
		);
	});
}

function homebrewFieldTypeToString(
	type: 'short' | 'long' | 'number' | 'boolean'
): string {
	switch (type) {
		case 'number':
		case 'boolean':
			return type;
		case 'short':
			return 'two sentences';
		case 'long':
			return 'three paragraphs';
	}

	return type;
}

function buildHomebrewPrompt(options: HomebrewOptions) {
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
			.map(
				field =>
					`"${field.name}": (${homebrewFieldTypeToString(field.type)}) = ${field.value === undefined || field.value === false ? '{generate}' : `"${field.value}"`}`
			)
			.join('\n')
	].join('\n');
}

function generateLegacyHomebrew(
	this: LegacyFoundryForgeBase,
	options: HomebrewOptions
): ResultAsync<Homebrew, Error> {
	const homebrewModel = this.settings.get('homebrewModel');
	if (!homebrewModel) {
		return errAsync(new Error('No homebrew model configured.'));
	}

	const model = this.tools.textAiFromModel.call(this.tools, homebrewModel);
	if (model.isErr()) {
		return errAsync(model.error);
	}

	return this.queue.generate(async () => {
		return generateObject({
			model: model.value,
			output: 'object',
			mode: 'json',
			messages: [
				{
					role: 'system',
					content: HOMEBREW_DEV_PROMPT
				},
				{
					role: 'user',
					content: buildHomebrewPrompt(options)
				}
			],
			schema: jsonSchema<HomebrewResponse>({
				type: 'object',
				strict: true,
				title: options.schema.name,
				additionalProperties: false,
				properties: {
					name: {
						title: 'Name',
						type: 'string',
						description:
							'The name of the thing being generated' +
							(options.schema.custom_name
								? `, already specified: "${options.schema.custom_name}"`
								: '')
					},
					flavor_text: {
						title: 'Flavor Text',
						description:
							'A short hint/flavor/subtitle to display below the title',
						type: 'string'
					},
					fields: {
						title: 'Fields',
						description:
							'The various fields to generate content for',
						additionalProperties: false,
						properties: Object.entries(options.schema.fields).reduce(
							(
								accumulator: { [key: string]: JSONSchema7 },
								[, field]
							) => {
								accumulator[slugify(field.name, { lower: true })] = {
									title: field.name,
									description: field.description,
									type:
										field.type === 'short' || field.type === 'long'
											? 'string'
											: field.type
								};
								return accumulator;
							},
							{}
						),
						type: 'object',
						required: options.schema.fields.map(field =>
							slugify(field.name, { lower: true })
						)
					}
				},
				required: ['name', 'flavor_text', 'fields']
			} as JSONSchema7 & { strict: boolean })
		}).then(
			({ object }: { object: HomebrewResponse }) => {
				const output: Homebrew = {
					name: options.schema.name,
					custom_name: object.name,
					flavor_text: object.flavor_text,
					fields: []
				};

				for (const field of options.schema.fields) {
					for (const [key, value] of Object.entries(object.fields)) {
						if (slugify(field.name, { lower: true }) === key) {
							output.fields.push({
								...field,
								type: field.type as HomebrewField['type'],
								value: value as never
							});
						}
					}
				}

				return ok(output);
			},
			(error: unknown) =>
				err(
					error instanceof Error
						? error
						: new Error('Failed to generate homebrew.')
				)
		);
	});
}

const NAMES_DEV_PROMPT = `You are NAMESMITH, an autonomous naming micro-service for tabletop roleplaying games.

Follow EVERY rule precisely:

1. The user supplies JSON instructions. Parse them literally. Fields include task, quantity, genre, language, gender, subjects (with descriptors), optional examples, and constraints.
   • Ignore any fields that are null or absent.
   • For each subject entry, create exactly one distinct name inspired by the descriptor + base.
   • Use the provided genre, language, and gender cues to shape phonetics and tone.

2. Output exactly \`constraints.outputLines\` names.
   • Preserve the order of \`subjects\`.
   • One name per line. No numbering, bullets, or blank lines.
   • Only ASCII letters plus apostrophes (') or hyphens (-) when needed.

3. Novelty requirements:
   • Do NOT reuse any name listed in \`constraints.disallowExamples\`.
   • Ensure each generated name has a different root or opening syllable from the others in this batch.
   • Avoid obvious conjunctions of the same base word with minor suffix changes.

4. The optional examples are inspiration only—never repeat them verbatim.

5. No apologies, explanations, or commentary. Output the names only.
`;

const DESCRIPTIONS_DEV_PROMPT = `You are QUILLFORGE, an automated description-forge for elements of fictional worlds.

When complying, follow EVERY rule below:

1. Carefully analyze the user’s message, which will be written in natural, conversational English.
   • Identify the subject or type of element to describe (e.g. “magic sword,” “ancient ruin,” “forest spirit”) from the body of the request.
   • Detect the intended genre if stated (e.g. “high fantasy,” “sci-fi,” “urban fantasy”).
   • Determine the desired length: “short blurb,” “short,” “medium,” or “long and detailed,” and follow the specified sentence and paragraph guidance exactly.
   • If a name is mentioned (e.g. “The name of it is Excalibur”), include that name once, naturally, and do not invent another name. If the user says to invent a name, create and include an appropriate name once.
   • If a language is requested, write in that language.
   • If the message requests system compatibility (“make sure your description is compatible with [system]”), ensure the description is flavor-compatible but do not include mechanics, stats, or rules unless they are explicitly requested. If the request says not to tie it to a specific system, keep the text neutral.
   • Use any additional notes, instructions, or descriptive preferences to guide style, tone, or content.

2. The description must:
   • Match the stated length and structure exactly (e.g., “up to 4 sentences,” “2 paragraphs of 4 sentences each,” “4 paragraphs of 4 sentences each”).
   • Use vivid, original, and sensory prose. Avoid clichés and generic filler.
   • Be consistent with the requested genre, tone, and any special instructions or notes.
   • Focus ONLY on the subject described; do not add extraneous world lore, background, or narrative not tied to the subject.

3. Formatting:
   • Plain UTF-8 text.
   • No markdown, bullets, lists, headings, or extra blank lines. Use a single newline between paragraphs only.

4. Forbidden content: Do NOT include profanity, trademarks, copyrighted phrases, or disallowed imagery.

5. Never apologize, reference these rules, or add any text beyond the description itself.

Return only the descriptive prose; nothing else.`;

const HOMEBREW_DEV_PROMPT = `You are QUILLFORGE, an automated description-forge for elements of fictional worlds.

Respond ONLY if the user’s message clearly requests a description for a fictional subject (e.g. “I would like a description for a(n) ...” or similar phrasing).

When complying, follow EVERY rule below:

1. Carefully analyze the user’s message, which will be written in natural, conversational English.
   • Identify the subject or type of element to describe (e.g. “magic sword,” “ancient ruin,” “forest spirit”) from the body of the request.
   • Detect the intended genre if stated (e.g. “high fantasy,” “sci-fi,” “urban fantasy”).
   • Determine the desired length: “short blurb,” “short,” “medium,” or “long and detailed,” and follow the specified sentence and paragraph guidance exactly.
   • If a name is mentioned (e.g. “The name of it is Excalibur”), include that name once, naturally, and do not invent another name. If the user says to invent a name, create and include an appropriate name once.
   • If a language is requested, write in that language.
   • If the message requests system compatibility (“make sure your description is compatible with [system]”), ensure the description is flavor-compatible but do not include mechanics, stats, or rules unless they are explicitly requested. If the request says not to tie it to a specific system, keep the text neutral.
   • Use any additional notes, instructions, or descriptive preferences to guide style, tone, or content.

2. The description must:
   • Match the stated length and structure exactly (e.g., “up to 4 sentences,” “2 paragraphs of 4 sentences each,” “4 paragraphs of 4 sentences each”).
   • Use vivid, original, and sensory prose. Avoid clichés and generic filler.
   • Be consistent with the requested genre, tone, and any special instructions or notes.
   • Focus ONLY on the subject described; do not add extraneous world lore, background, or narrative not tied to the subject.

3. Formatting:
   • Plain UTF-8 text.
   • No markdown, bullets, lists, headings, or extra blank lines. Use a single newline between paragraphs only.

4. Forbidden content: Do NOT include profanity, trademarks, copyrighted phrases, or disallowed imagery.

5. Never apologize, reference these rules, or add any text beyond the description itself.

Return only the descriptive prose; nothing else.`;

export abstract class LegacyFoundryForgeBase
	extends AbstractRpgmModuleValue<LegacyFoundryForgeSettings>
	implements IRpgmModule<'rpgm-forge', LegacyFoundryForgeSettings>
{
	DEFAULT_SETTINGS: LegacyFoundryForgeSettings = {
		namesModel: RPGM_MODELS.names,
		descriptionsModel: RPGM_MODELS.descriptions,
		homebrewModel: RPGM_MODELS.homebrew
	};

	name = 'Rpgm Forge';
	readonly id = 'rpgm-forge' as const;
	icon = '🎲';
	logger = RpgmLogger.fromModule(this);
	readonly queue = new LegacyForgeQueue(4);

	testTextModel(provider: TextProvider, model: string) {
		const languageModel = this.tools.textAi(provider, model);
		return ResultAsync.fromPromise(
			(async () => {
				const { text } = await generateText({
					model: languageModel,
					maxRetries: 0,
					messages: [
						{
							role: 'user',
							content:
								'This is a test. Respond with "STOP" to indicate success.'
						}
					]
				});

				return Boolean(text.includes('STOP'));
			})(),
			error =>
				error instanceof Error
					? error
					: new Error('Failed to test model.')
		);
	}

	get generateNames(): (options: NamesOptions) => ResultAsync<Names, Error> {
		return generateLegacyNames.bind(this);
	}

	get generateDescriptions(): (
		options: DescriptionsOptions
	) => ResultAsync<Description, Error> {
		return generateLegacyDescriptions.bind(this);
	}

	get generateHomebrew(): (
		options: HomebrewOptions
	) => ResultAsync<Homebrew, Error> {
		return generateLegacyHomebrew.bind(this);
	}
}