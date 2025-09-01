import { HomebrewSchemas } from '@rpgm/tools/forge';
import { Forge, type HomebrewSchema } from '@rpgm/tools/forge';
import { argument, literal, string } from 'brigadier-ts-lite';
import ISO639 from 'iso-639-1';
import type { Component } from 'vue';

import { ChatWizard } from '#/chat/ChatWizard';
import { RpgmModule } from '#/module';
import { inputHeuristics, shimmerInput, writeOn } from '#/radial-menu';
import DescriptionChat from '$/chat/DescriptionChat.vue';
import HomebrewChat from '$/chat/Homebrew/HomebrewChat.vue';
import InitPrompt from '$/chat/InitPrompt.vue';
import NamesChat from '$/chat/NamesChat.vue';
import { command } from '$/util/homebrew';
import { chatDescription, chatTokenNames, getSelectedToken, quickNameToken, registerTokenCreate } from '$/util/token';
import Genres from '$$/assets/combined_systems.json?url';

import ForgeSidebar from './sidebar/ForgeSidebar.vue';


/**
 * RpgmForge stores chat databases for forge wizards
 */
export class RpgmForge extends RpgmModule<'rpgm-forge'> {
	override mod!: Forge;

	/** @returns The current genre setting */
	get genre() { return game.settings.get('rpgm-forge', 'genre'); }

	/** @returns The current method setting */
	get method() { return game.settings.get('rpgm-forge', 'method'); }

	/** @returns The current system setting */
	get system() { return game.system.title; }

	/** @returns The current language setting */
	get language() { return game.settings.get('rpgm-forge', 'language'); }

	homebrewSchemas: HomebrewSchema[] = [];
	genres: Partial<Record<string, { genre: string }>> = {};

	promptChats!: ChatWizard;
	nameChats!: ChatWizard<ForgeChatNames>;
	descriptionsChats!: ChatWizard<ForgeChatDescription>;
	homebrewChats!: ChatWizard<ForgeChatHomebrew>;

	/**
	 * Called before everything else.
	 * Not much goes on in here.
	 */
	override async init(): Promise<void> {
		rpgm.forge = this;
		this.mod = new Forge({
			singleton: rpgm.tools,
			logger: {
				show: rpgm.show
			},
			settings: RpgmModule.settings('rpgm-forge'),
			maxConcurrency: 4
		});
		this.homebrewSchemas = HomebrewSchemas as HomebrewSchema[];
		this.genres = await (await fetch(Genres)).json() as typeof this.genres;
		this.promptChats = new ChatWizard(
			this.id,
			'prompt',
			InitPrompt as Component,
			this.name,
			this.logger
		);
		this.promptChats.load();
		this.nameChats = new ChatWizard<ForgeChatNames>(
			this.id,
			'name',
			NamesChat as Component,
			this.name,
			this.logger
		);
		this.nameChats.load();
		this.descriptionsChats = new ChatWizard<ForgeChatDescription>(
			this.id,
			'description',
			DescriptionChat as Component,
			this.name,
			this.logger
		);
		this.descriptionsChats.load();
		this.homebrewChats = new ChatWizard<ForgeChatHomebrew>(
			this.id,
			'homebrew',
			HomebrewChat as Component,
			this.name,
			this.logger
		);
		this.homebrewChats.load();
	}

	/**
	 * Register module-specific settings here.
	 * Also where Radial Menu buttons, RP-Commands, and chat commands are registered.
	 */
	override registerSettings(): void {
		game.settings.register('rpgm-forge', 'auto_name', {
			name: rpgm.localize('RPGM_FORGE.CONFIG.AUTO_NAME'),
			hint: rpgm.localize('RPGM_FORGE.CONFIG.AUTO_NAME_HINT'),
			default: true,
			type: Boolean,
			config: true
		});
		game.settings.register('rpgm-forge', 'rename_actors', {
			name: rpgm.localize('RPGM_FORGE.CONFIG.RENAME_ACTORS'),
			hint: rpgm.localize('RPGM_FORGE.CONFIG.RENAME_ACTORS_HINT'),
			default: true,
			scope: 'world',
			type: Boolean,
			config: true
		});
		game.settings.register('rpgm-forge', 'has_been_prompted', {
			default: false,
			scope: 'world',
			type: Boolean
		});
		game.settings.register('rpgm-forge', 'language', {
			name: rpgm.localize('RPGM_FORGE.CONFIG.LANGUAGE'),
			hint: rpgm.localize('RPGM_FORGE.CONFIG.LANGUAGE_HINT'),
			default: getLanguage(game.i18n.lang),
			scope: 'world',
			type: String,
			config: true
		});
		game.settings.register('rpgm-forge', 'system', {
			name: rpgm.localize('RPGM_FORGE.CONFIG.SYSTEM'),
			hint: rpgm.localize('RPGM_FORGE.CONFIG.SYSTEM_HINT'),
			default: game.system.title,
			scope: 'world',
			type: String,
			config: true
		});
		game.settings.register('rpgm-forge', 'genre', {
			name: rpgm.localize('RPGM_FORGE.CONFIG.GENRE'),
			hint: rpgm.localize('RPGM_FORGE.CONFIG.GENRE_HINT'),
			default: this.genres[game.system.id]?.['genre'] || 'Fantasy',
			scope: 'world',
			type: String,
			config: true
		});
		game.settings.register('rpgm-forge', 'method', {
			name: rpgm.localize('RPGM_FORGE.CONFIG.METHOD'),
			hint: rpgm.localize('RPGM_FORGE.CONFIG.METHOD_HINT'),
			default: 'ai',
			scope: 'world',
			choices: {
				ai: rpgm.localize('RPGM_FORGE.CONFIG.METHOD_AI'),
				simple: rpgm.localize('RPGM_FORGE.CONFIG.METHOD_SIMPLE')
			},
			type: String,
			config: true
		});
		rpgm.chat.registerCommand(literal('name')
			.then(argument('prompt', string('greedy_phrase')).executes(c => {
				void chatTokenNames(undefined, c.get<string>('prompt'));
			})).executes(() => {
				void chatTokenNames(undefined);
			}));
		rpgm.chat.registerCommand(literal('description')
			.then(argument('prompt', string('greedy_phrase')).executes(c => {
				void chatDescription({ type: c.get<string>('prompt')! });
			})).executes(() => {
				const token = getSelectedToken();
				if (!token) return;
				chatDescription(
					{
						type: token.actor!.prototypeToken.name,
						// Don't include name if it's the default actor name
						name: token.name ? token.name !== token.actor!.prototypeToken.name ? token.name : '' : ''
					});
			}));
		command();
		rpgm.radialMenu.registerCategory('rpgm_forge', { color: '276deg', logger: this.logger });
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-dice-d4',
			tooltip: 'RPGM_FORGE.RADIAL_MENU.D4',
			detective: (context) => inputHeuristics(context).noNumber().result,
			callback: async (context) => {
				const shimmer = shimmerInput(context);
				await writeOn(context, `Rolled a ${Math.floor(Math.random() * 4) + 1}`, 250);
				shimmer();
			},
			logger: this.logger
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-dice-d6',
			tooltip: 'RPGM_FORGE.RADIAL_MENU.D6',
			detective: (context) => inputHeuristics(context).noNumber().result,
			callback: async (context) => {
				const shimmer = shimmerInput(context);
				await writeOn(context, `Rolled a ${Math.floor(Math.random() * 6) + 1}`, 250);
				shimmer();
			},
			logger: this.logger
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-signature',
			tooltip: 'RPGM_FORGE.RADIAL_MENU.NAMES',
			callback: async (context) => {
				if (!context.token) return rpgm.forge.logger.visible.log('No token selected');
				if (context.shift)
					void chatTokenNames(context.token, context.token.actor?.prototypeToken?.name);
				else
					return quickNameToken(context.token.document);
			},
			logger: this.logger
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-align-left',
			tooltip: 'RPGM_FORGE.RADIAL_MENU.DESCRIPTION',
			callback: (context) => {
				const token = context.token;
				if (!token) return rpgm.forge.logger.log('No token selected');
				chatDescription({
					type: token.actor!.prototypeToken.name,
					// Don't include name if it's the default actor name
					name: token.name ? token.name !== token.actor!.prototypeToken.name ? token.name : '' : ''
				});
			},
			logger: this.logger
		});
		rpgm.sidebar.registerSidebarMenu({
			path: '/forge',
			meta: {
				title: 'Forge',
				menu: {
					icon: 'fas fa-dice-d12',
					color: '#290b53'
				}
			},
			component: ForgeSidebar
		});
		registerTokenCreate();
	}

	/**
	 * Called when everything else in Foundry is loaded.
	 */
	override rpgmReady(): Promise<void> | void {
		if (this.promptChats.data.size === 0 && !game.settings.get('rpgm-forge', 'has_been_prompted'))
			void this.promptChats.newMessage();
	}
}

/**
 * @param code - The ISO 639 code of the language.
 * @returns The language name
 */
function getLanguage(code: string) {
	return ISO639.getName(code) || 'English';
}
