import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'..'
);
const changelogPlaceholder = '{{CHANGELOG_SECTION}}';

function parseArguments(argv) {
	const options = {
		moduleId: 'forge'
	};

	for (let index = 0; index < argv.length; index += 1) {
		const value = argv[index];

		if (value === '--module') {
			options.moduleId = argv[index + 1] ?? options.moduleId;
			index += 1;
			continue;
		}

		if (value === '--help' || value === '-h') {
			options.help = true;
		}
	}

	return options;
}

function printHelp() {
	console.log(
		'Usage: node ./scripts/build-foundry-marketplace-body.mjs [--module <forge>]'
	);
}

function parseVersion(version) {
	return version.split('.').map(part => Number.parseInt(part, 10) || 0);
}

function compareVersionsDescending(leftVersion, rightVersion) {
	const leftParts = parseVersion(leftVersion);
	const rightParts = parseVersion(rightVersion);
	const maxLength = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < maxLength; index += 1) {
		const leftPart = leftParts[index] ?? 0;
		const rightPart = rightParts[index] ?? 0;

		if (leftPart !== rightPart) {
			return rightPart - leftPart;
		}
	}

	return 0;
}

function stripLeadingTitle(markdown) {
	return markdown.replace(/^#\s+.+?(\r?\n){1,2}/u, '').trim();
}

function normalizeChangelogHeadings(markdown) {
	return markdown.replace(
		/^(#{1,6})\s+(.+)$/gmu,
		(_, __, headingText) => `#### ${headingText}\n`
	);
}

async function renderChangelogSection(changelogDirectoryPath) {
	const directoryEntries = await readdir(changelogDirectoryPath, {
		withFileTypes: true
	});

	const changelogVersions = directoryEntries
		.filter(entry => entry.isFile())
		.map(entry => {
			const match = /^v(?<version>.+)\.md$/u.exec(entry.name);
			if (!match?.groups?.version) return undefined;

			return {
				fileName: entry.name,
				version: match.groups.version
			};
		})
		.filter(Boolean)
		.sort((leftEntry, rightEntry) =>
			compareVersionsDescending(leftEntry.version, rightEntry.version)
		);

	const renderedEntries = await Promise.all(
		changelogVersions.map(async ({ fileName, version }) => {
			const filePath = path.join(changelogDirectoryPath, fileName);
			const sourceMarkdown = await readFile(filePath, 'utf8');
			const normalizedMarkdown = normalizeChangelogHeadings(
				stripLeadingTitle(sourceMarkdown)
			);

			return [`### v${version}`, normalizedMarkdown]
				.filter(Boolean)
				.join('\n\n');
		})
	);

	return ['## Changelog', ...renderedEntries].join('\n\n').trim();
}

async function buildMarketplaceBody(options) {
	const moduleFolderName = `rpgm-${options.moduleId}`;
	const marketplaceDirectoryPath = path.join(
		repoRoot,
		'modules',
		moduleFolderName,
		'assets',
		'foundry-marketplace'
	);
	const templatePath = path.join(
		marketplaceDirectoryPath,
		'body.template.md'
	);
	const outputPath = path.join(marketplaceDirectoryPath, 'body.generated.md');
	const changelogDirectoryPath = path.join(
		repoRoot,
		'modules',
		moduleFolderName,
		'assets',
		'changelog'
	);

	const [templateMarkdown, changelogSection] = await Promise.all([
		readFile(templatePath, 'utf8'),
		renderChangelogSection(changelogDirectoryPath)
	]);

	if (!templateMarkdown.includes(changelogPlaceholder)) {
		throw new Error(
			`Template ${templatePath} is missing the ${changelogPlaceholder} placeholder.`
		);
	}

	const renderedMarkdown = templateMarkdown
		.replace(changelogPlaceholder, changelogSection)
		.trim()
		.concat('\n');

	await writeFile(outputPath, renderedMarkdown, 'utf8');

	console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
	return outputPath;
}

const options = parseArguments(process.argv.slice(2));

if (options.help) {
	printHelp();
	process.exit(0);
}

buildMarketplaceBody(options).catch(error => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
