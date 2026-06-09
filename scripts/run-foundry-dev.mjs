import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');
const foundryEnvPath = path.resolve(repoRoot, '.env');
const stewardEnvPath = path.resolve(
	repoRoot,
	'..',
	'..',
	'rpgm-tools',
	'rpgm-steward',
	'.env'
);

const DEFAULT_PUBLIC_RPGM_BASE_URL = 'https://rpgm.tools';
const DEFAULT_BETA_RPGM_BASE_URL = 'https://beta.rpgm.tools';

// Keep explicit dev targets here so local Foundry smoke runs can switch
// between the production-facing service surface and the public beta lane
// without hand-editing repo-local env files.
const targets = {
	'v13-dev': {
		foundryUrl: '127.0.0.1:30013',
		proxyUrl: 'http://127.0.0.13:32013',
		accountWebBaseUrl: DEFAULT_PUBLIC_RPGM_BASE_URL,
		stewardUrl: DEFAULT_PUBLIC_RPGM_BASE_URL,
		viteHost: '127.0.0.13',
		vitePort: 32013,
		label: 'Foundry 13 dev lane'
	},
	'v14-dev': {
		foundryUrl: '127.0.0.1:30014',
		proxyUrl: 'http://127.0.0.14:32014',
		accountWebBaseUrl: DEFAULT_PUBLIC_RPGM_BASE_URL,
		stewardUrl: DEFAULT_PUBLIC_RPGM_BASE_URL,
		viteHost: '127.0.0.14',
		vitePort: 32014,
		label: 'Foundry 14 dev lane'
	},
	'v13-beta': {
		foundryUrl: '127.0.0.1:30013',
		proxyUrl: 'http://127.0.1.13:32113',
		accountWebBaseUrl: DEFAULT_BETA_RPGM_BASE_URL,
		stewardUrl: DEFAULT_BETA_RPGM_BASE_URL,
		viteHost: '127.0.1.13',
		vitePort: 32113,
		label: 'Foundry 13 beta lane'
	},
	'v14-beta': {
		foundryUrl: '127.0.0.1:30014',
		proxyUrl: 'http://127.0.1.14:32114',
		accountWebBaseUrl: DEFAULT_BETA_RPGM_BASE_URL,
		stewardUrl: DEFAULT_BETA_RPGM_BASE_URL,
		viteHost: '127.0.1.14',
		vitePort: 32114,
		label: 'Foundry 14 beta lane'
	}
};

function parseArguments(argv) {
	const options = {
		moduleName: 'rpgm-forge',
		targetName: 'v14-dev'
	};

	for (let index = 0; index < argv.length; index += 1) {
		const value = argv[index];
		if (value === '--module') {
			options.moduleName = argv[index + 1] ?? options.moduleName;
			index += 1;
			continue;
		}
		if (value === '--target') {
			options.targetName = argv[index + 1] ?? options.targetName;
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
		`Usage: node ./scripts/run-foundry-dev.mjs [--module <name>] [--target <v13-dev|v14-dev|v13-beta|v14-beta>]\n\nDefaults:\n  --module rpgm-forge\n  --target v14-dev`
	);
}

function resolvePackageManagerCommand() {
	if (process.platform !== 'win32') {
		return { command: 'pnpm', shell: false };
	}

	// On Windows, invoking pnpm.cmd directly through spawn can throw EINVAL.
	// Running through the shell is the reliable path for this helper.
	return { command: 'pnpm', shell: true };
}

function normalizeOptionalEnvValue(value) {
	if (typeof value !== 'string') {
		return null;
	}

	const normalizedValue = value.trim();
	return normalizedValue.length > 0 ? normalizedValue : null;
}

function readDotEnvValue(filePath, key) {
	if (!fs.existsSync(filePath)) {
		return null;
	}

	const pattern = new RegExp(`^${key}=(.*)$`, 'm');
	const match = pattern.exec(fs.readFileSync(filePath, 'utf8'));

	if (!match) {
		return null;
	}

	const rawValue = match[1]?.trim() ?? '';
	const quote = rawValue[0];
	const unquotedValue =
		(quote === '"' || quote === "'") && rawValue.endsWith(quote)
			? rawValue.slice(1, -1)
			: rawValue;

	return normalizeOptionalEnvValue(unquotedValue);
}

function resolveStewardDevAccessKey() {
	return (
		normalizeOptionalEnvValue(process.env.RPGM_STEWARD_DEV_ACCESS_KEY) ??
		normalizeOptionalEnvValue(process.env.STEWARD_DEV_ACCESS_KEY) ??
		readDotEnvValue(foundryEnvPath, 'RPGM_STEWARD_DEV_ACCESS_KEY') ??
		readDotEnvValue(foundryEnvPath, 'STEWARD_DEV_ACCESS_KEY') ??
		readDotEnvValue(stewardEnvPath, 'STEWARD_DEV_ACCESS_KEY')
	);
}

function resolveAccountWebBaseUrl(target) {
	return (
		normalizeOptionalEnvValue(process.env.RPGM_ACCOUNT_WEB_BASE_URL) ??
		readDotEnvValue(foundryEnvPath, 'RPGM_ACCOUNT_WEB_BASE_URL') ??
		target.accountWebBaseUrl
	);
}

function resolveStewardUrl(target) {
	return (
		normalizeOptionalEnvValue(process.env.RPGM_STEWARD_URL) ??
		readDotEnvValue(foundryEnvPath, 'RPGM_STEWARD_URL') ??
		target.stewardUrl
	);
}

async function assertTargetIsReachable(target) {
	try {
		const response = await fetch(`http://${target.foundryUrl}`, {
			method: 'GET',
			redirect: 'manual',
			signal: AbortSignal.timeout(4000)
		});
		return response.status;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Cannot reach ${target.label} at http://${target.foundryUrl}. Start that Foundry dev lane first, then rerun this command. Details: ${reason}`
		);
	}
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}

	const target = targets[options.targetName];
	if (!target) {
		throw new Error(
			`Unknown target \"${options.targetName}\". Expected one of: ${Object.keys(targets).join(', ')}`
		);
	}

	const status = await assertTargetIsReachable(target);
	console.log(
		`Launching ${options.moduleName} against ${target.label} (Foundry http://${target.foundryUrl}, proxy ${target.proxyUrl}, probe status ${status}).`
	);

	const packageManager = resolvePackageManagerCommand();
	const stewardDevAccessKey = resolveStewardDevAccessKey();
	const accountWebBaseUrl = resolveAccountWebBaseUrl(target);
	const stewardUrl = resolveStewardUrl(target);
	const child = spawn(
		packageManager.command,
		['--filter', options.moduleName, 'dev'],
		{
			stdio: 'inherit',
			shell: packageManager.shell,
			env: {
				...process.env,
				RPGM_ACCOUNT_WEB_BASE_URL: accountWebBaseUrl,
				RPGM_DEV_HOST: target.viteHost,
				RPGM_DEV_PORT: String(target.vitePort),
				RPGM_STEWARD_URL: stewardUrl,
				RPGM_API_URL: target.proxyUrl,
				RPGM_FOUNDRY_URL: target.foundryUrl,
				RPGM_STEWARD_DEV_ACCESS_KEY: stewardDevAccessKey ?? undefined,
				STEWARD_DEV_ACCESS_KEY: stewardDevAccessKey ?? undefined,
				VITE_FOUNDRY_URL: target.foundryUrl,
				VITE_RPGM_URL: target.proxyUrl
			}
		}
	);

	child.on('exit', code => {
		process.exit(code ?? 0);
	});
	child.on('error', error => {
		console.error(error);
		process.exit(1);
	});
}

main().catch(error => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
