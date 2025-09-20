export default {
	RPGM_FORGE: {
		NAMES: {
			ASSIGN_TOOLTIP: 'Click to assign this name to the selected token',
			PROVIDERS: {
				RPGM: 'AI-generated creative names (uses your daily text quota).',
				OFFLINE: 'Offline curated weighted list of fantasy names (no quota).',
				ADJECTIVE: 'Random adjective + base actor name (offline, no quota).',
				CUSTOM: 'Custom provider model from your configured AI provider.'
			}
		},
		HOMEBREW: {
			PLACEHOLDER: 'Leave blank to let AI decide'
		},
		CONFIG: {
			AUTO_NAME: 'Auto Name Tokens',
			AUTO_NAME_HINT: 'Tokens placed on the canvas will automatically be named. You can hold shift to bypass this feature.',
			RENAME_ACTORS: 'Rename Actors',
			RENAME_ACTORS_HINT: 'Whether to change a token actor\'s name when renaming the token.',
			LANGUAGE: 'Language',
			LANGUAGE_HINT: 'The language to use for AI-generated content.',
			SYSTEM: 'System',
			SYSTEM_HINT: 'The game system to base AI-generated content on.',
			GENRE: 'Genre',
			GENRE_HINT: 'The genre to base AI-generated content on.'
		},
		RADIAL_MENU: {
			D4: 'Roll a D4',
			D6: 'Roll a D6',
			LOREM_IPSUM: 'Lorem Ipsum',
			START_SHIMMER: 'Shimmer',
			STOP_SHIMMER: 'Stop Shimmer',
			NAMES: 'Generate Name',
			DESCRIPTION: 'Generate Description',
			DELETE: 'Delete',
			REGENERATE: 'Regenerate',
			COPY: 'Copy to clipboard',
			SEND_TO_JOURNAL: 'Send to Jounal',
			OPEN_JOURNAL: 'Open Journal'
		},
		ERRORS: {
			TOKEN_SELECT: 'Please select a token on the canvas and try again.',
			TOKEN_OWNER: 'You must have ownership of the token to rename it.',
			TEXT_LIMIT: 'You have reached your daily limit on text generations, but names will continue to generate offline.'
		},
		INIT: {
			TITLE: 'Welcome to RPGM Forge!',
			PROMPT1: 'Get started with free generation by signing up in the RPGM Tools sidebar!',
			PROMPT3: 'Please confirm these options:',
			PROMPT4: '(You can change them later in settings)',
			BUTTON: 'Open RPGM Tools Sidebar'
		}
	}
} satisfies ForgeI18n;
