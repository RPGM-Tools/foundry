import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { loadDotEnvFilesUpTree } from './lib/load-dotenv.mjs';
import {
	listFoundryDevTargetNames,
	resolveFoundryDevTarget
} from './lib/foundry-dev-targets.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');
const defaultSshHost = '184.169.203.118';
const defaultSshUser = 'ec2-user';
const defaultProbeTimeoutMilliseconds = 4_000;
const remoteStartTimeoutMilliseconds = 20_000;
const remoteStartPollIntervalMilliseconds = 2_000;

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

		if (value === '--skip-build') {
			options.skipBuild = true;
			continue;
		}

		if (value === '--skip-start') {
			options.skipStart = true;
			continue;
		}

		if (value === '--skip-verify') {
			options.skipVerify = true;
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
		[
			`Usage: node ./scripts/deploy-foundry-test-lane.mjs [--module <name>] [--target <${listFoundryDevTargetNames().join('|')}>] [--skip-build] [--skip-start] [--skip-verify]`,
			'',
			'Defaults:',
			'  --module rpgm-forge',
			'  --target v14-dev',
			'',
			'Environment:',
			'  RPGM_FOUNDRY_TEST_SSH_KEY_PATH   Workspace-local private key path',
			'  RPGM_FOUNDRY_TEST_SSH_HOST       Override the AWS host (default 184.169.203.118)',
			'  RPGM_FOUNDRY_TEST_SSH_USER       Override the SSH user (default ec2-user)',
			'  RPGM_FOUNDRY_TEST_V13_DEV_DATA_PATH / RPGM_FOUNDRY_TEST_V14_DEV_DATA_PATH',
			'  RPGM_FOUNDRY_TEST_V13_DEV_START_SCRIPT / RPGM_FOUNDRY_TEST_V14_DEV_START_SCRIPT'
		].join('\n')
	);
}

function normalizeOptionalEnvValue(value) {
	if (typeof value !== 'string') {
		return null;
	}

	const normalizedValue = value.trim();
	return normalizedValue.length > 0 ? normalizedValue : null;
}

function firstNonEmptyString(...values) {
	for (const value of values) {
		const normalizedValue = normalizeOptionalEnvValue(value);
		if (normalizedValue) {
			return normalizedValue;
		}
	}

	return null;
}

function quotePosixShellArgument(value) {
	return `'${String(value).replaceAll(`'`, `'\\''`)}'`;
}

function sleep(milliseconds) {
	return new Promise(resolve => {
		setTimeout(resolve, milliseconds);
	});
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

function spawnWithInheritedIo(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			...options,
			stdio: options.stdio ?? 'inherit'
		});

		child.on('error', reject);
		child.on('exit', code => {
			if ((code ?? 0) === 0) {
				resolve();
				return;
			}

			reject(
				new Error(
					`${command} ${args.join(' ')} exited with code ${code ?? 1}.`
				)
			);
		});
	});
}

function resolveWorkspaceRoot() {
	return path.resolve(repoRoot, '..', '..');
}

async function resolveWorkspacePrivateKeyPath() {
	const tempDirectoryPath = path.join(resolveWorkspaceRoot(), '.temp');
	if (!fs.existsSync(tempDirectoryPath)) {
		return null;
	}

	const entries = await readdir(tempDirectoryPath, { withFileTypes: true });
	const candidateFiles = await Promise.all(
		entries
			.filter(
				entry =>
					entry.isFile() &&
					entry.name.endsWith('.pem') &&
					!entry.name.includes('_public')
			)
			.map(async entry => {
				const filePath = path.join(tempDirectoryPath, entry.name);
				const stats = await fs.promises.stat(filePath);
				return {
					filePath,
					modifiedTime: stats.mtimeMs
				};
			})
	);

	if (candidateFiles.length === 0) {
		return null;
	}

	candidateFiles.sort(
		(left, right) => right.modifiedTime - left.modifiedTime
	);
	return candidateFiles[0].filePath;
}

function buildRemoteDataPathEnvKey(foundryVersion) {
	return `RPGM_FOUNDRY_TEST_V${foundryVersion}_DEV_DATA_PATH`;
}

function buildRemoteStartScriptEnvKey(foundryVersion) {
	return `RPGM_FOUNDRY_TEST_V${foundryVersion}_DEV_START_SCRIPT`;
}

async function resolveRemoteAccess(target) {
	await loadDotEnvFilesUpTree(repoRoot);

	const discoveredWorkspacePrivateKeyPath =
		await resolveWorkspacePrivateKeyPath();
	const sshKeyPath = firstNonEmptyString(
		process.env.RPGM_FOUNDRY_TEST_SSH_KEY_PATH,
		process.env.FOUNDRY_TEST_SSH_KEY_PATH,
		discoveredWorkspacePrivateKeyPath
	);
	if (!sshKeyPath) {
		throw new Error(
			'Missing RPGM_FOUNDRY_TEST_SSH_KEY_PATH and no workspace .temp private key was discovered.'
		);
	}

	const resolvedSshKeyPath = path.resolve(sshKeyPath);
	if (!fs.existsSync(resolvedSshKeyPath)) {
		throw new Error(`SSH key file was not found at ${resolvedSshKeyPath}.`);
	}

	const sshHost =
		firstNonEmptyString(
			process.env.RPGM_FOUNDRY_TEST_SSH_HOST,
			process.env.FOUNDRY_TEST_SSH_HOST
		) ?? defaultSshHost;
	const sshUser =
		firstNonEmptyString(
			process.env.RPGM_FOUNDRY_TEST_SSH_USER,
			process.env.FOUNDRY_TEST_SSH_USER
		) ?? defaultSshUser;
	const remoteDataPath =
		firstNonEmptyString(
			process.env[buildRemoteDataPathEnvKey(target.foundryVersion)]
		) ?? target.remoteDataPath;
	const remoteStartScript =
		firstNonEmptyString(
			process.env[buildRemoteStartScriptEnvKey(target.foundryVersion)]
		) ?? target.remoteStartScript;

	return {
		remoteDataPath,
		remoteStartScript,
		sshHost,
		sshKeyPath: resolvedSshKeyPath,
		sshUser
	};
}

function buildSshArguments(remoteAccess, remoteCommand) {
	return [
		'-o',
		'StrictHostKeyChecking=no',
		'-i',
		remoteAccess.sshKeyPath,
		`${remoteAccess.sshUser}@${remoteAccess.sshHost}`,
		remoteCommand
	];
}

async function runRemoteCommand(remoteAccess, remoteCommand) {
	await spawnWithInheritedIo(
		'ssh',
		buildSshArguments(remoteAccess, remoteCommand)
	);
}

async function buildModule(options, target) {
	const packageManager = resolvePackageManagerCommand();
	await spawnWithInheritedIo(
		packageManager.command,
		[...packageManager.prefixArgs, '--filter', options.moduleName, 'build'],
		{
			cwd: repoRoot,
			env: {
				...process.env,
				RPGM_ACCOUNT_WEB_BASE_URL: target.accountWebBaseUrl,
				RPGM_API_URL: target.stewardUrl,
				RPGM_STEWARD_URL: target.stewardUrl
			},
			shell: packageManager.shell
		}
	);
}

async function readJsonFile(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

async function syncDirectoryToRemote({
	remoteAccess,
	sourceDirectoryPath,
	targetDirectoryPath
}) {
	const incomingDirectoryPath = `${targetDirectoryPath}.__incoming`;
	const previousDirectoryPath = `${targetDirectoryPath}.__previous`;
	const quotedIncomingDirectoryPath = quotePosixShellArgument(
		incomingDirectoryPath
	);
	const quotedPreviousDirectoryPath = quotePosixShellArgument(
		previousDirectoryPath
	);
	const quotedTargetDirectoryPath =
		quotePosixShellArgument(targetDirectoryPath);
	const quotedTargetParentDirectoryPath = quotePosixShellArgument(
		path.posix.dirname(targetDirectoryPath)
	);

	await runRemoteCommand(
		remoteAccess,
		[
			`mkdir -p ${quotedTargetParentDirectoryPath}`,
			`rm -rf ${quotedIncomingDirectoryPath}`,
			`mkdir -p ${quotedIncomingDirectoryPath}`
		].join(' && ')
	);

	await new Promise((resolve, reject) => {
		const tarProcess = spawn('tar', ['-cf', '-', '.'], {
			cwd: sourceDirectoryPath,
			stdio: ['ignore', 'pipe', 'inherit']
		});
		const sshProcess = spawn(
			'ssh',
			buildSshArguments(
				remoteAccess,
				`tar -xf - -C ${quotedIncomingDirectoryPath}`
			),
			{
				stdio: ['pipe', 'inherit', 'inherit']
			}
		);

		tarProcess.on('error', reject);
		sshProcess.on('error', reject);
		tarProcess.stdout.pipe(sshProcess.stdin);

		let tarExited = false;
		let sshExited = false;
		let failed = false;

		const completeIfDone = () => {
			if (failed || !tarExited || !sshExited) {
				return;
			}

			resolve();
		};

		tarProcess.on('exit', code => {
			if ((code ?? 0) !== 0) {
				failed = true;
				reject(new Error(`tar stream exited with code ${code ?? 1}.`));
				return;
			}

			tarExited = true;
			completeIfDone();
		});

		sshProcess.on('exit', code => {
			if ((code ?? 0) !== 0) {
				failed = true;
				reject(new Error(`ssh receive exited with code ${code ?? 1}.`));
				return;
			}

			sshExited = true;
			completeIfDone();
		});
	});

	await runRemoteCommand(
		remoteAccess,
		[
			`rm -rf ${quotedPreviousDirectoryPath}`,
			`if [ -e ${quotedTargetDirectoryPath} ]; then mv ${quotedTargetDirectoryPath} ${quotedPreviousDirectoryPath}; fi`,
			`mv ${quotedIncomingDirectoryPath} ${quotedTargetDirectoryPath}`
		].join(' && ')
	);
}

async function probeTarget(
	target,
	timeoutMilliseconds = defaultProbeTimeoutMilliseconds
) {
	try {
		const response = await fetch(target.probeUrl, {
			method: 'GET',
			redirect: 'manual',
			signal: AbortSignal.timeout(timeoutMilliseconds)
		});
		if (response.status >= 500) {
			return {
				error: `HTTP ${response.status} ${response.statusText}`,
				reachable: false,
				status: response.status
			};
		}

		return {
			reachable: true,
			status: response.status
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : String(error),
			reachable: false,
			status: null
		};
	}
}

async function ensureRemoteTargetIsRunning({ options, remoteAccess, target }) {
	const probeResult = await probeTarget(target);
	if (probeResult.reachable) {
		return probeResult;
	}

	if (options.skipStart) {
		throw new Error(
			`Cannot reach ${target.label} at ${target.foundryUrl}. Start that lane first, or rerun without --skip-start. Details: ${probeResult.error ?? 'unreachable'}`
		);
	}

	const remoteLogFilePath = `${remoteAccess.remoteDataPath}/Logs/test-lane-launch.log`;
	const quotedRemoteLogFilePath = quotePosixShellArgument(remoteLogFilePath);
	const quotedRemoteStartScript = quotePosixShellArgument(
		remoteAccess.remoteStartScript
	);
	const processMatchPattern = quotePosixShellArgument(
		`[m]ain.js --dataPath=${remoteAccess.remoteDataPath}`
	);

	await runRemoteCommand(
		remoteAccess,
		[
			`mkdir -p ${quotePosixShellArgument(path.posix.dirname(remoteLogFilePath))}`,
			`if ! pgrep -af ${processMatchPattern} >/dev/null; then nohup ${quotedRemoteStartScript} >> ${quotedRemoteLogFilePath} 2>&1 < /dev/null & fi`
		].join(' && ')
	);

	const deadline = Date.now() + remoteStartTimeoutMilliseconds;
	while (Date.now() < deadline) {
		await sleep(remoteStartPollIntervalMilliseconds);
		const retryProbeResult = await probeTarget(target);
		if (retryProbeResult.reachable) {
			return retryProbeResult;
		}
	}

	throw new Error(
		`Started ${target.label}, but ${target.foundryUrl} did not become reachable within ${Math.round(remoteStartTimeoutMilliseconds / 1000)} seconds.`
	);
}

async function fetchRequiredText(url, description) {
	const response = await fetch(url, {
		signal: AbortSignal.timeout(10_000)
	});
	if (!response.ok) {
		throw new Error(
			`${description} request failed with ${response.status} ${response.statusText}.`
		);
	}

	return response.text();
}

async function verifyRemoteAssets({ localManifest, moduleName, target }) {
	const cacheBust = `t=${Date.now()}`;
	const moduleBaseUrl = `${target.foundryUrl}/modules/${moduleName}`;
	const remoteManifestUrl = `${moduleBaseUrl}/module.json?${cacheBust}`;
	const remoteManifestResponse = await fetch(remoteManifestUrl, {
		signal: AbortSignal.timeout(10_000)
	});
	if (!remoteManifestResponse.ok) {
		throw new Error(
			`Remote module manifest request failed with ${remoteManifestResponse.status} ${remoteManifestResponse.statusText}.`
		);
	}

	const remoteManifest = await remoteManifestResponse.json();
	if (remoteManifest.version !== localManifest.version) {
		throw new Error(
			`Remote module version mismatch. Expected ${localManifest.version}, received ${remoteManifest.version}. The public dev hostname is not serving the synced dev-lane payload; verify the reverse proxy target and backend process for that host.`
		);
	}

	const returnHtml = await fetchRequiredText(
		`${moduleBaseUrl}/account-session-return.html?${cacheBust}`,
		'Account session return HTML'
	);
	if (!returnHtml.includes('account-session-return.js')) {
		throw new Error(
			'Remote account-session-return.html is stale. It does not reference account-session-return.js, which usually means the public dev hostname is still serving an older backend payload.'
		);
	}

	const returnScriptResponse = await fetch(
		`${moduleBaseUrl}/account-session-return.js?${cacheBust}`,
		{
			signal: AbortSignal.timeout(10_000)
		}
	);
	if (!returnScriptResponse.ok) {
		throw new Error(
			`Remote account-session-return.js request failed with ${returnScriptResponse.status} ${returnScriptResponse.statusText}.`
		);
	}

	return {
		moduleBaseUrl,
		remoteManifestUrl,
		version: remoteManifest.version
	};
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}

	const target = resolveFoundryDevTarget(options.targetName);
	if (!target) {
		throw new Error(
			`Unknown target "${options.targetName}". Expected one of: ${listFoundryDevTargetNames().join(', ')}`
		);
	}

	const moduleRoot = path.join(repoRoot, 'modules', options.moduleName);
	const distDirectoryPath = path.join(moduleRoot, '.dist');
	const distManifestPath = path.join(distDirectoryPath, 'module.json');
	const remoteAccess = await resolveRemoteAccess(target);
	const remoteModuleDirectoryPath = `${remoteAccess.remoteDataPath}/Data/modules/${options.moduleName}`;

	if (!options.skipBuild) {
		console.log(
			`Building ${options.moduleName} for ${target.label} against ${target.stewardUrl}.`
		);
		await buildModule(options, target);
	}

	if (!fs.existsSync(distDirectoryPath) || !fs.existsSync(distManifestPath)) {
		throw new Error(
			`Built module output is missing at ${distDirectoryPath}. Run the build first, or omit --skip-build.`
		);
	}

	const localManifest = await readJsonFile(distManifestPath);
	console.log(
		`Syncing ${options.moduleName} v${localManifest.version} to ${target.label} on ${remoteAccess.sshHost}.`
	);
	await syncDirectoryToRemote({
		remoteAccess,
		sourceDirectoryPath: distDirectoryPath,
		targetDirectoryPath: remoteModuleDirectoryPath
	});

	const probeResult = await ensureRemoteTargetIsRunning({
		options,
		remoteAccess,
		target
	});
	console.log(
		`Remote lane reachable at ${target.foundryUrl} (probe status ${probeResult.status ?? 'unknown'}).`
	);

	if (options.skipVerify) {
		console.log('Skipped remote asset verification by request.');
		return;
	}

	const verificationResult = await verifyRemoteAssets({
		localManifest,
		moduleName: options.moduleName,
		target
	});
	console.log(
		[
			`Verified ${options.moduleName} v${verificationResult.version} on ${target.label}.`,
			`Module URL: ${verificationResult.moduleBaseUrl}`,
			`Manifest URL: ${verificationResult.remoteManifestUrl}`
		].join('\n')
	);
}

main().catch(error => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
