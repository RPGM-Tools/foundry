import { execFileSync, spawn } from 'node:child_process';

const targets = {
	'v13-dev': {
		foundryUrl: '127.0.0.1:30013',
		proxyUrl: 'http://127.0.0.13:32013',
		viteHost: '127.0.0.13',
		vitePort: 32013,
		label: 'Foundry 13 dev lane'
	},
	'v14-dev': {
		foundryUrl: '127.0.0.1:30014',
		proxyUrl: 'http://127.0.0.14:32014',
		viteHost: '127.0.0.14',
		vitePort: 32014,
		label: 'Foundry 14 dev lane'
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
	console.log(`Usage: node ./scripts/run-foundry-dev.mjs [--module <name>] [--target <v13-dev|v14-dev>]\n\nDefaults:\n  --module rpgm-forge\n  --target v14-dev`);
}

function resolvePackageManagerCommand() {
	if (process.platform !== 'win32') {
		return { command: 'pnpm', shell: false };
	}

	try {
		const output = execFileSync('where.exe', ['pnpm.cmd'], {
			encoding: 'utf8'
		});
		const command = output
			.split(/\r?\n/u)
			.map(line => line.trim())
			.find(Boolean);
		if (command) {
			return { command, shell: false };
		}
	} catch {
		// Fall back to the shell-backed lookup below when PATH inspection fails.
	}

	return { command: 'pnpm', shell: true };
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
	const child = spawn(packageManager.command, ['--filter', options.moduleName, 'dev'], {
		stdio: 'inherit',
		shell: packageManager.shell,
		env: {
			...process.env,
			RPGM_DEV_HOST: target.viteHost,
			RPGM_DEV_PORT: String(target.vitePort),
			RPGM_FOUNDRY_URL: target.foundryUrl,
			VITE_FOUNDRY_URL: target.foundryUrl
		}
	});

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