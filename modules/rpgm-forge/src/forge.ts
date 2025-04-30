import { RpgmModule } from "#/module";
import { literal, argument, string } from "brigadier-ts-lite";
import { chatTokenNames, renameToken } from "./util/token";
import { inputHeuristics, shimmerInput, writeOn } from "#/radial-menu";
import { shimmerToken } from "./util/shimmer";
import type { Component } from "vue";
import NamesChat from "./chat/NamesChat.vue";

export class RpgmForge extends RpgmModule {
	override id: string = "rpgm-forge";
	override name: string = "RPGM Forge";

	override init(): Promise<void> | void {
		rpgm.forge = this;
	}

	override registerSettings(): Promise<void> | void {
		game.settings.register("rpgm-forge", "names", { default: {} });
		rpgm.chat.registerCommand(literal("name")
			.then(argument("prompt", string("greedy_phrase")).executes(c => {
				void chatTokenNames(c.get<string>("prompt"));
			})).executes(() => {
				void chatTokenNames();
			}));
		rpgm.radialMenu.registerCategory("rpgm_forge", { color: "276deg" });
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-dice-d4',
			tooltip: "RPGM_FORGE.RADIAL_MENU.D4",
			detective: (context) => inputHeuristics(context).noNumber().result,
			callback: async (context) => {
				const effect = shimmerInput(context);
				await writeOn(context, `Rolled a ${Math.floor(Math.random() * 4) + 1}`, 250);
				effect();
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-dice-d6',
			tooltip: "RPGM_FORGE.RADIAL_MENU.D6",
			detective: (context) => inputHeuristics(context).noNumber().result,
			callback: async (context) => {
				const effect = shimmerInput(context);
				await writeOn(context, `Rolled a ${Math.floor(Math.random() * 6) + 1}`, 250);
				effect();
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-comment',
			tooltip: "RPGM_FORGE.RADIAL_MENU.LOREM_IPSUM",
			detective: (context) => inputHeuristics(context).isChat().noNumber().result,
			callback: async (context) => {
				const effect = shimmerInput(context);
				await writeOn(context, "Hello, World! Here is some lorem ipsum for you to consider.", 500);
				effect();
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-sparkles',
			tooltip: "RPGM_FORGE.RADIAL_MENU.START_SHIMMER",
			detective: (context) => inputHeuristics(context).isChat().noNumber().result,
			callback: (context) => {
				context.element.classList.add("rpgm-active");
			}
		});
		rpgm.radialMenu.registerInputButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa-regular fa-sparkle',
			tooltip: "RPGM_FORGE.RADIAL_MENU.STOP_SHIMMER",
			detective: (context) => inputHeuristics(context).isChat().noNumber().result,
			callback: (context) => {
				context.element.classList.remove("rpgm-active");
			}
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-input-text',
			tooltip: "RPGM_FORGE.RADIAL_MENU.NAMES",
			detective: () => true,
			callback: async (context) => {
				if (!context.token) return rpgm.logger.log("No token selected");
				return renameToken(context.token.document);
			}
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa fa-sparkles',
			tooltip: "RPGM_FORGE.RADIAL_MENU.START_SHIMMER",
			detective: () => true,
			callback: async (context) => {
				if (!context.token) return;
				const filter = await shimmerToken(context.token);
				return filter.fadeIn(500);
			}
		});
		rpgm.radialMenu.registerTokenHudButton({
			category: rpgm.radialMenu.categories.rpgm_forge,
			icon: 'fa-regular fa-sparkle',
			tooltip: "RPGM_FORGE.RADIAL_MENU.STOP_SHIMMER",
			detective: () => true,
			callback: async (context) => {
				if (!context.token) return;
				const filter = await shimmerToken(context.token);
				return filter.fadeOut(500);
			}
		});
	}

	override i18nInit(): Promise<void> | void { }

	override rpgmReady(): Promise<void> | void {
		this.loadNames();
		this.pruneNames();
	}

	names!: Map<string, ForgeChatNames>;

	loadNames() {
		this.names = new Map(Object.entries(game.settings.get("rpgm-forge", "names")));
		rpgm.chat.registerMessageRenderer((id, message) =>
			this.names.has(id) || message.flags["rpgm-forge"] === "names"
				? NamesChat as Component : undefined);
	}

	saveNames() {
		void game.settings.set("rpgm-forge", "names", Object.fromEntries(this.names));
	}

	pruneNames() {
		this.names = Array.from(this.names).reduce((obj, [key, value]) => {
			if (ui.chat.collection.has(key)) obj.set(key, value);
			return obj;
		}, new Map<string, ForgeChatNames>());
		this.saveNames();
	}

	getName(id: string) {
		return this.names.get(id);
	}

	setName(id: string, data: ForgeChatNames) {
		rpgm.logger.debug(id);
		this.names.set(id, data);
		this.saveNames();
	}
}
