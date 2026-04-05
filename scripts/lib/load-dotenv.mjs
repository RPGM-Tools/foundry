import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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

function listParentDirectories(startDirectoryPath) {
	const directories = [];
	let currentDirectoryPath = path.resolve(startDirectoryPath);

	while (true) {
		directories.push(currentDirectoryPath);
		const parentDirectoryPath = path.dirname(currentDirectoryPath);
		if (parentDirectoryPath === currentDirectoryPath) {
			break;
		}
		currentDirectoryPath = parentDirectoryPath;
	}

	return directories.reverse();
}

async function loadEnvFile(envPath) {
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
}

export async function loadDotEnvFilesUpTree(startDirectoryPath) {
	for (const directoryPath of listParentDirectories(startDirectoryPath)) {
		const envPath = path.join(directoryPath, '.env');

		try {
			await loadEnvFile(envPath);
		} catch {
			// Missing .env files are optional. This helper walks upward so workspace-root
			// secrets can be shared across nested repos without copying them into each repo.
		}
	}
}