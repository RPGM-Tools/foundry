import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import showdown from 'showdown';

import { loadDotEnvFilesUpTree } from './lib/load-dotenv.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultEditUrl = 'https://foundryvtt.com/packages/rpgm-forge/edit';
const expectedPublicHeading = 'RPGM Forge: AI-Augmented Prep and Play for Foundry VTT';

function parseArguments(argv) {
	const options = {
		moduleId: 'forge',
		editUrl: defaultEditUrl,
		headless: true,
		dryRun: false
	};

	for (let index = 0; index < argv.length; index += 1) {
		const value = argv[index];

		if (value === '--module') {
			options.moduleId = argv[index + 1] ?? options.moduleId;
			index += 1;
			continue;
		}

		if (value === '--edit-url') {
			options.editUrl = argv[index + 1] ?? options.editUrl;
			index += 1;
			continue;
		}

		if (value === '--body-file') {
			options.bodyFilePath = argv[index + 1];
			index += 1;
			continue;
		}

		if (value === '--headed') {
			options.headless = false;
			continue;
		}

		if (value === '--dry-run') {
			options.dryRun = true;
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
		'Usage: node ./scripts/update-foundry-marketplace-page.mjs [--module <forge>] [--edit-url <url>] [--body-file <path>] [--headed] [--dry-run]'
	);
}

function firstNonEmptyString(...values) {
	for (const value of values) {
		if (typeof value !== 'string') continue;
		const trimmedValue = value.trim();
		if (trimmedValue) {
			return trimmedValue;
		}
	}

	return undefined;
}

function resolveBodyFilePath(options) {
	if (options.bodyFilePath) {
		return path.resolve(options.bodyFilePath);
	}

	return path.join(
		repoRoot,
		'modules',
		`rpgm-${options.moduleId}`,
		'assets',
		'foundry-marketplace',
		'body.generated.md'
	);
}

function buildHtmlFromMarkdown(markdown) {
	const converter = new showdown.Converter({
		ghCompatibleHeaderId: false,
		openLinksInNewWindow: false,
		parseImgDimensions: true,
		simpleLineBreaks: false,
		strikethrough: true,
		tables: true
	});

	return converter.makeHtml(markdown).trim();
}

async function dismissCookieBannerIfPresent(page) {
	for (const buttonName of ['Required Only', 'Accept All Cookies']) {
		const button = page.getByRole('button', { name: buttonName });
		if (await button.count()) {
			await button.first().click();
			return;
		}
	}
}

async function fillFirstVisibleLocator(page, selectors, value) {
	for (const selector of selectors) {
		const locator = page.locator(selector).first();
		if (!(await locator.count()) || !(await locator.isVisible())) continue;

		await locator.fill(value);
		return true;
	}

	return false;
}

async function clickFirstVisible(page, selectors) {
	for (const selector of selectors) {
		const locator = page.locator(selector).first();
		if (!(await locator.count()) || !(await locator.isVisible())) continue;

		await locator.click();
		return true;
	}

	return false;
}

async function ensureLoggedIn(page, editUrl, username, password) {
	await page.goto(editUrl, { waitUntil: 'domcontentloaded' });
	await dismissCookieBannerIfPresent(page);

	if (await page.locator('#id_description').count()) {
		return;
	}

	const loginUrl = new URL('https://foundryvtt.com/auth/login/');
	loginUrl.searchParams.set('next', new URL(editUrl).pathname);

	await page.goto(loginUrl.toString(), { waitUntil: 'domcontentloaded' });
	await dismissCookieBannerIfPresent(page);

	const filledUsername = await fillFirstVisibleLocator(
		page,
		['#id_login', 'input[name="login"]', '#id_username', 'input[name="username"]', 'input[type="email"]'],
		username
	);
	const filledPassword = await fillFirstVisibleLocator(
		page,
		['#id_password', 'input[name="password"]', 'input[type="password"]'],
		password
	);

	if (!filledUsername || !filledPassword) {
		throw new Error('Could not find the Foundry marketplace login form fields.');
	}

	const clickedSubmit = await clickFirstVisible(page, [
		'button[type="submit"]',
		'input[type="submit"]',
		'button:has-text("Log In")',
		'button:has-text("Login")',
		'button:has-text("Sign In")',
		'a:has-text("LOG IN")',
		'a:has-text("Log In")',
		'text=/^\s*LOG IN\s*$/i'
	]);

	if (!clickedSubmit) {
		await page.keyboard.press('Enter');
	}

	await page.waitForLoadState('domcontentloaded');
	await page.goto(editUrl, { waitUntil: 'domcontentloaded' });

	if (!(await page.locator('#id_description').count())) {
		throw new Error('Foundry login did not reach the package edit form.');
	}
	}

async function updateDescriptionField(page, descriptionHtml) {
	await page.locator('#id_description').waitFor({ state: 'attached' });

	await page.evaluate((html) => {
		const textarea = document.querySelector('#id_description');
		if (!textarea) {
			throw new Error('Description textarea not found.');
		}

		textarea.value = html;
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
		textarea.dispatchEvent(new Event('change', { bubbles: true }));

		const editor = window.tinymce?.get('id_description');
		if (editor) {
			editor.setContent(html);
			editor.save();
		}
	}, descriptionHtml);
}

async function saveForm(page) {
	await Promise.all([
		page.waitForLoadState('networkidle'),
		page.getByRole('button', { name: 'Save Package' }).click()
	]);
}

async function verifyPublicPage(page) {
	await page.goto('https://foundryvtt.com/packages/rpgm-forge/', {
		waitUntil: 'domcontentloaded'
	});
	await page.waitForFunction(
		(headingText) => document.body?.innerText?.includes(headingText),
		expectedPublicHeading,
		{ timeout: 30000 }
	);
}

async function updateMarketplacePage(options) {
	await loadDotEnvFilesUpTree(repoRoot);

	const username = firstNonEmptyString(process.env.FOUNDRY_MARKETPLACE_USERNAME);
	const password = firstNonEmptyString(process.env.FOUNDRY_MARKETPLACE_PASSWORD);
	if (!username || !password) {
		throw new Error('Missing FOUNDRY_MARKETPLACE_USERNAME or FOUNDRY_MARKETPLACE_PASSWORD in the environment.');
	}

	const bodyFilePath = resolveBodyFilePath(options);
	const markdownBody = await readFile(bodyFilePath, 'utf8');
	const htmlBody = buildHtmlFromMarkdown(markdownBody);
	const browser = await chromium.launch({ headless: options.headless });

	try {
		const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
		await ensureLoggedIn(page, options.editUrl, username, password);
		await updateDescriptionField(page, htmlBody);

		if (options.dryRun) {
			console.log(`Dry run validated Foundry marketplace update for ${options.editUrl}`);
			console.log(`Body source: ${bodyFilePath}`);
			return;
		}

		await saveForm(page);
		await verifyPublicPage(page);

		console.log(`Updated Foundry marketplace page: ${options.editUrl}`);
		console.log(`Body source: ${bodyFilePath}`);
	} finally {
		await browser.close();
	}
}

const options = parseArguments(process.argv.slice(2));

if (options.help) {
	printHelp();
	process.exit(0);
}

updateMarketplacePage(options).catch(error => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});