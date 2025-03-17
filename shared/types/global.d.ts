interface RPGM {
	gameVersion: string
	majorGameVersion: number
	settings: {},
	forge?: ForgeApi
	vault?: VaultApi
	tome?: TomeApi
}

declare global {
	var rpgm: RPGM
}

declare global {
	interface SettingConfig {
		'rpgm-tools.api_key': string
	}
}

export { }
