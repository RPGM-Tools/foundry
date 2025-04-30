import { RpgmModule } from "#/module";

export class RpgmVault extends RpgmModule {
	override id: string = "rpgm-vault";
	override name: string = "RPGM Vault";

	override init(): Promise<void> | void { }

	override registerSettings(): Promise<void> | void {
		game.settings.register("rpgm-vault", "foo", {
			name: "Foo",
			config: true,
			default: ""
		});
	}

	override i18nInit(): Promise<void> | void { }

	override rpgmReady(): Promise<void> | void { }
}
