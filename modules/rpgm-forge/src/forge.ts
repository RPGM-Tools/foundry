import { RpgmModule } from "#/module";
import { literal, argument, string } from "brigadier-ts-lite";
import { chatDescription, chatTokenNames, getSelectedToken, applyTokenName } from "./util/token";
import { hudHeuristics, inputHeuristics, shimmerInput, writeOn } from "#/radial-menu";
import { shimmerToken } from "./util/shimmer";
import type { Component } from "vue";
import NamesChat from "./chat/NamesChat.vue";
import DescriptionChat from "./chat/DescriptionChat.vue";
import { RPGMLogger } from "#/util/logging";
import { ChatDatabase } from "#/chat/ChatDatabase";
import { command } from "./util/homebrew";
import HomebrewChat from "./chat/Homebrew/HomebrewChat.vue";
import Homebrews from "@rpgm/forge/data/schemas.json?url";

/**
 * {@link RpgmForge} stores chat databases for forge wizards
 */
export class RpgmForge extends RpgmModule {
	override id: string = "rpgm-forge";
	override name: string = "RPGM Forge";
	override readonly logger = new RPGMLogger("🎲 RPGM Forge");
	namesChats = new ChatDatabase<ForgeChatNames>(
		this.id,
		"names",
		NamesChat as Component,
		this.name
	);
	descriptionsChats = new ChatDatabase<ForgeChatDescription>(
		this.id,
		"description",
		DescriptionChat as Component,
		this.name
	);
	homebrewChats = new ChatDatabase<ForgeChatHomebrew>(
		this.id,
		"homebrew",
		HomebrewChat as Component,
		this.name
	);
	homebrewSchemas: HomebrewOptions[] = [];

	/**
	 * Called before everything else
	 * Not much goes on in here
	 */
	override async init(): Promise<void> {
		rpgm.forge = this;
		this.homebrewSchemas = await (await fetch(Homebrews)).json() as HomebrewOptions[];
	}

	/**
	 * Register module-specific settings here
	 * Also where Radial Menu buttons and RP-Commands are registered (might change)
	 */
	override registerSettings(): Promise<void> | void {
		command();
		game.settings.register("rpgm-forge", "names", { default: {} });
		game.settings.register("rpgm-forge", "description", { default: {} });
		rpgm.chat.registerCommand(literal("name")
			.then(argument("prompt", string("greedy_phrase")).executes(c => {
				void chatTokenNames(c.get<string>("prompt"));
			})).executes(() => {
				void chatTokenNames();
			}));
		rpgm.chat.registerCommand(literal("description")
			.then(argument("prompt", string("greedy_phrase")).executes(c => {
				void chatDescription({ type: c.get<string>("prompt")! });
			})).executes(() => {
				const token = getSelectedToken();
				if (!token) return;
				void chatDescription(
					{
						type: token.actor!.name,
						// Don't include name if it's the default actor name
						name: token.name ? token.name !== token.actor!.name ? token.name : "" : ""
					});
			}));
		rpgm.radialMenu.registerCategory("rpgm_forge", { color: "276deg" });
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-dice-d4',
			tooltip: "RPGM_FORGE.RADIAL_MENU.D4",
			detective: (context) => inputHeuristics(context).noNumber().result,
			callback: async (context) => {
				const shimmer = shimmerInput(context);
				await writeOn(context, `Rolled a ${Math.floor(Math.random() * 4) + 1}`, 250);
				shimmer();
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-dice-d6',
			tooltip: "RPGM_FORGE.RADIAL_MENU.D6",
			detective: (context) => inputHeuristics(context).noNumber().result,
			callback: async (context) => {
				const shimmer = shimmerInput(context);
				await writeOn(context, `Rolled a ${Math.floor(Math.random() * 6) + 1}`, 250);
				shimmer();
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-comment',
			tooltip: "RPGM_FORGE.RADIAL_MENU.LOREM_IPSUM",
			detective: (context) => inputHeuristics(context).isChat().noNumber().result,
			callback: async (context) => {
				const shimmer = shimmerInput(context);
				await writeOn(context, "Hello, World! Here is some lorem ipsum for you to consider.", 500);
				shimmer();
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_debug,
			icon: 'fa fa-sparkles',
			tooltip: "RPGM_FORGE.RADIAL_MENU.START_SHIMMER",
			detective: (context) => inputHeuristics(context).isChat().noNumber().result,
			callback: (context) => {
				shimmerInput(context);
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_debug,
			icon: 'fa-regular fa-sparkle',
			tooltip: "RPGM_FORGE.RADIAL_MENU.STOP_SHIMMER",
			detective: (context) => inputHeuristics(context).isChat().noNumber().result,
			callback: (context) => {
				shimmerInput(context)();
			}
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-signature',
			tooltip: "RPGM_FORGE.RADIAL_MENU.NAMES",
			callback: async (context) => {
				if (!context.token) return rpgm.logger.logU("No token selected");
				if (context.shift)
					void chatTokenNames(context.token.actor!.name);
				else
					return applyTokenName(context.token.document);
			}
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-align-left',
			tooltip: "RPGM_FORGE.RADIAL_MENU.DESCRIPTION",
			callback: (context) => {
				const token = context.token;
				if (!token) return rpgm.logger.log("No token selected");
				chatDescription({
					type: token.actor!.name,
					// Don't include name if it's the default actor name
					name: token.name ? token.name !== token.actor!.name ? token.name : "" : ""
				});
			}
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_debug,
			icon: 'fa fa-sparkles',
			tooltip: "RPGM_FORGE.RADIAL_MENU.START_SHIMMER",
			detective: context => hudHeuristics(context).isDebug().result,
			callback: async (context) => {
				if (!context.token) return;
				const filter = await shimmerToken(context.token);
				return filter.fadeIn(500);
			}
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_debug,
			icon: 'fa-regular fa-sparkle',
			tooltip: "RPGM_FORGE.RADIAL_MENU.STOP_SHIMMER",
			detective: context => hudHeuristics(context).isDebug().result,
			callback: async (context) => {
				if (!context.token) return;
				const filter = await shimmerToken(context.token);
				return filter.fadeOut(500);
			}
		});
	}

	/**
	 * Currently used for loading chat databases
	 */
	override i18nInit(): Promise<void> | void {
		this.namesChats.load();
		this.descriptionsChats.load();
		this.homebrewChats.load();
	}

	/** (unused) */
	override rpgmReady(): Promise<void> | void { }
}
