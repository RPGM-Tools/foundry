import { RpgmModule } from "#/module";
import { literal, argument, string } from "brigadier-ts-lite";
import { chatDescription, chatTokenNames, getSelectedToken, quickNameToken, registerTokenCreate } from "./util/token";
import { inputHeuristics, shimmerInput, writeOn } from "#/radial-menu";
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
	override icon: string = "🎲";
	override readonly logger = new RPGMLogger(`${this.icon} ${this.name}`);
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
		game.settings.register("rpgm-forge", "auto_name", {
			name: rpgm.localize("RPGM_FORGE.CONFIG.AUTO_NAME"),
			hint: rpgm.localize("RPGM_FORGE.CONFIG.AUTO_NAME_HINT"),
			default: true,
			type: Boolean,
			config: true,
		});
		game.settings.register("rpgm-forge", "rename_actors", {
			name: rpgm.localize("RPGM_FORGE.CONFIG.RENAME_ACTORS"),
			hint: rpgm.localize("RPGM_FORGE.CONFIG.RENAME_ACTORS_HINT"),
			default: false,
			type: Boolean,
			config: true,
		});
		rpgm.chat.registerCommand(literal("name")
			.then(argument("prompt", string("greedy_phrase")).executes(c => {
				void chatTokenNames(undefined, c.get<string>("prompt"));
			})).executes(() => {
				void chatTokenNames(undefined);
			}));
		rpgm.chat.registerCommand(literal("description")
			.then(argument("prompt", string("greedy_phrase")).executes(c => {
				void chatDescription({ type: c.get<string>("prompt")! });
			})).executes(() => {
				const token = getSelectedToken();
				if (!token) return;
				void chatDescription(
					{
						type: token.actor!.prototypeToken.name,
						// Don't include name if it's the default actor name
						name: token.name ? token.name !== token.actor!.prototypeToken.name ? token.name : "" : ""
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
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-signature',
			tooltip: "RPGM_FORGE.RADIAL_MENU.NAMES",
			callback: async (context) => {
				if (!context.token) return rpgm.logger.logU("No token selected");
				if (context.shift)
					void chatTokenNames(context.token, context.token.actor?.prototypeToken?.name);
				else
					return quickNameToken(context.token.document);
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
		this.namesChats.load();
		this.descriptionsChats.load();
		this.homebrewChats.load();
		registerTokenCreate();
	}

	/** (unused) */
	override rpgmReady(): Promise<void> | void { }
}
