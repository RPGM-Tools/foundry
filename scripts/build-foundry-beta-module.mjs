import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_BETA_BASE_URL = 'https://beta.rpgm.tools';
const repoRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'..'
);

function parseArguments(argv) {
	const options = {
		betaBaseUrl: DEFAULT_BETA_BASE_URL,
		moduleName: 'rpgm-forge'
	};

	for (let index = 0; index < argv.length; index += 1) {
		const value = argv[index];

		if (value === '--module') {
			options.moduleName = argv[index + 1] ?? options.moduleName;
			index += 1;
			continue;
		}

		if (value === '--base-url') {
			options.betaBaseUrl = argv[index + 1] ?? options.betaBaseUrl;
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
		'Usage: node ./scripts/build-foundry-beta-module.mjs [--module <rpgm-forge>] [--base-url <https://beta.rpgm.tools>]'
	);
}

function resolvePackageManagerCommand() {
	if (process.platform !== 'win32') {
		return { command: 'pnpm', prefixArgs: [], shell: false };
	}

	return {
		command: process.env.ComSpec ?? 'cmd.exe',
		prefixArgs: ['/d', '/s', '/c', 'pnpm'],
		shell: false
	};
}

async function readJsonFile(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}

	const packageManager = resolvePackageManagerCommand();
	const child = spawn(
		packageManager.command,
		[...packageManager.prefixArgs, '--filter', options.moduleName, 'build'],
		{
			cwd: repoRoot,
			env: {
				...process.env,
				RPGM_ACCOUNT_WEB_BASE_URL: options.betaBaseUrl,
				RPGM_API_URL: options.betaBaseUrl
			},
			shell: packageManager.shell,
			stdio: 'inherit'
		}
	);

	child.on('error', error => {
		console.error(error);
		process.exit(1);
	});

	child.on('exit', async code => {
		if ((code ?? 0) !== 0) {
			process.exit(code ?? 1);
			return;
		}

		const moduleRoot = path.join(repoRoot, 'modules', options.moduleName);
		const [packageMetadata, distManifest] = await Promise.all([
			readJsonFile(path.join(moduleRoot, 'package.json')),
			readJsonFile(path.join(moduleRoot, '.dist', 'module.json'))
		]);

		console.log(
			[
				`Built ${options.moduleName} for beta against ${options.betaBaseUrl}.`,
				`Payload folder: ${path.join(moduleRoot, '.dist')}`,
				`Manual archive name: ${distManifest.id}-v${packageMetadata.version}.zip`,
				`Companion manifest name: ${distManifest.id}.json`
			].join('\n')
		);
	});
}

main().catch(error => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
