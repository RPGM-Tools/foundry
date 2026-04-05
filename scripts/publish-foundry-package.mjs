import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const foundryReleaseEndpoint = 'https://foundryvtt.com/_api/packages/release_version/';
const defaultRepository = 'RPGM-Tools/foundry';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArguments(argv) {
	const options = {};

	for (let index = 0; index < argv.length; index += 1) {
		const value = argv[index];

		if (value === '--tag') {
			options.tag = argv[index + 1];
			index += 1;
			continue;
		}

		if (value === '--module') {
			options.moduleId = argv[index + 1];
			index += 1;
			continue;
		}

		if (value === '--notes-url') {
			options.notesUrl = argv[index + 1];
			index += 1;
			continue;
		}

		if (value === '--repo') {
			options.repository = argv[index + 1];
			index += 1;
			continue;
		}

		if (value === '--dry-run') {
			options.dryRun = true;
		}

		if (value === '--help' || value === '-h') {
			options.help = true;
		}
	}

	return options;
}

function printHelp() {
	console.log(
		'Usage: node ./scripts/publish-foundry-package.mjs --tag <forge-v1.2.3> [--module <forge>] [--notes-url <url>] [--repo <owner/repo>] [--dry-run]'
	);
}

function parseBoolean(value, fallback = false) {
	if (value == null || value === '') return fallback;
	return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function stripWrappingQuotes(value) {
	if (!value) return value;
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

async function loadDotEnvIfPresent() {
	const envPath = path.join(repoRoot, '.env');

	try {
		const envFile = await readFile(envPath, 'utf8');
		for (const rawLine of envFile.split(/\r?\n/u)) {
			const line = rawLine.trim();
			if (!line || line.startsWith('#')) continue;

			const separatorIndex = line.indexOf('=');
			if (separatorIndex <= 0) continue;

			const key = line.slice(0, separatorIndex).trim();
			const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());
			if (!(key in process.env)) {
				process.env[key] = value;
			}
		}
	} catch {
		// A local .env is optional. CI should use secrets, and local shells can export variables directly.
	}
}

function deriveReleaseInfo(tag) {
	const match = /^(?<moduleId>.+)-v(?<version>.+)$/u.exec(tag ?? '');
	if (!match?.groups) {
		throw new Error(
			`Invalid tag "${tag}". Expected a release tag like forge-v2.2.0.`
		);
	}

	return {
		moduleId: match.groups.moduleId,
		version: match.groups.version
	};
}

async function readJsonFile(filePath) {
	const fileContents = await readFile(filePath, 'utf8');
	return JSON.parse(fileContents);
}

function requireCompatibilityField(compatibility, fieldName) {
	const value = compatibility?.[fieldName];
	if (value == null || value === '') {
		throw new Error(
			`Missing compatibility.${fieldName} in the module manifest template.`
		);
	}
	return String(value);
}

function buildDefaultNotesUrl(repository, tag, moduleFolderName, version) {
	return `https://github.com/${repository}/blob/${tag}/modules/${moduleFolderName}/assets/changelog/v${version}.md`;
}

function buildFoundryPayload({
	moduleManifest,
	packageVersion,
	tag,
	repository,
	notesUrl,
	dryRun
}) {
	const compatibility = {
		minimum: requireCompatibilityField(moduleManifest.compatibility, 'minimum'),
		verified: requireCompatibilityField(moduleManifest.compatibility, 'verified')
	};

	if (moduleManifest.compatibility?.maximum) {
		compatibility.maximum = String(moduleManifest.compatibility.maximum);
	}

	const payload = {
		id: moduleManifest.id,
		release: {
			version: packageVersion,
			manifest: `https://github.com/${repository}/releases/download/${tag}/${moduleManifest.id}.json`,
			compatibility
		}
	};

	if (notesUrl) {
		payload.release.notes = notesUrl;
	}

	if (dryRun) {
		payload['dry-run'] = true;
	}

	return payload;
}

async function publishFoundryRelease(options) {
	await loadDotEnvIfPresent();

	const tag =
		options.tag ?? process.env.FOUNDRY_PUBLISH_TAG ?? process.env.GITHUB_REF_NAME;
	if (!tag) {
		throw new Error(
			'No release tag was provided. Pass --tag <module-vx.y.z> or set FOUNDRY_PUBLISH_TAG.'
		);
	}

	const derivedReleaseInfo = deriveReleaseInfo(tag);
	const moduleId =
		options.moduleId ??
		process.env.FOUNDRY_PUBLISH_MODULE_ID ??
		derivedReleaseInfo.moduleId;
	const repository =
		options.repository ?? process.env.GITHUB_REPOSITORY ?? defaultRepository;
	const dryRun =
		options.dryRun ?? parseBoolean(process.env.FOUNDRY_PUBLISH_DRY_RUN, false);
	const moduleFolderName = `rpgm-${moduleId}`;
	const moduleRoot = path.join(repoRoot, 'modules', moduleFolderName);

	const token = process.env.FOUNDRY_PACKAGE_RELEASE_TOKEN;
	if (!token) {
		throw new Error(
			'Missing FOUNDRY_PACKAGE_RELEASE_TOKEN. Set it in the environment, a GitHub Actions secret, or the repo-local .env file.'
		);
	}

	const [packageMetadata, moduleManifest] = await Promise.all([
		readJsonFile(path.join(moduleRoot, 'package.json')),
		readJsonFile(path.join(moduleRoot, 'public', 'module.json'))
	]);

	if (derivedReleaseInfo.version !== packageMetadata.version) {
		throw new Error(
			`Tag ${tag} does not match ${moduleFolderName} package version ${packageMetadata.version}.`
		);
	}

	if (moduleManifest.id !== moduleFolderName) {
		throw new Error(
			`Manifest id ${moduleManifest.id} does not match expected module id ${moduleFolderName}.`
		);
	}

	const notesUrl =
		options.notesUrl ??
		process.env.FOUNDRY_PUBLISH_NOTES_URL ??
		buildDefaultNotesUrl(
			repository,
			tag,
			moduleFolderName,
			packageMetadata.version
		);

	const payload = buildFoundryPayload({
		moduleManifest,
		packageVersion: packageMetadata.version,
		tag,
		repository,
		notesUrl,
		dryRun
	});

	const response = await fetch(foundryReleaseEndpoint, {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	const contentType = response.headers.get('content-type') ?? '';
	const responseBody = contentType.includes('application/json')
		? JSON.stringify(await response.json(), null, 2)
		: await response.text();

	if (!response.ok) {
		throw new Error(
			[`Foundry package release request failed with ${response.status} ${response.statusText}.`, responseBody]
				.filter(Boolean)
				.join('\n\n')
		);
	}

	console.log(
		`${dryRun ? 'Dry run validated' : 'Published'} ${moduleManifest.title} ${packageMetadata.version} to Foundry.`
	);
	console.log(responseBody);
	console.log(`Manifest URL: ${payload.release.manifest}`);
	if (payload.release.notes) {
		console.log(`Notes URL: ${payload.release.notes}`);
	}
}

const options = parseArguments(process.argv.slice(2));
if (options.help) {
	printHelp();
	process.exit(0);
}

publishFoundryRelease(options).catch(error => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
