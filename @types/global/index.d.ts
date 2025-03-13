interface RPGM {
	/** Current version of RPGM Tools */
	version: string
	gameVersion: string
	majorGameVersion: number
	debug: boolean

	config: {
		/** Maximum number of log messages to keep in history. */
		maxMessageHistory: number
		/** Minimum time interval between messages (ms). */
		minMessageInterval: number
		/** Maximum message length for UI notifications. */
		maxUIMessageLength: number
		/** Toggle persistent logs. */
		usePersistentLogs: false
	}

	defaults: {
		worldName: string
		language: string
		genre: string
		artStyle: string
		aiModel: string
		nameFormat: string
		descVerbosity: string
	}
}

declare global {
	var RPGM: RPGM
	var myvar: string
}

declare global {
	interface SettingConfig {
		'rpgm-tools.api_key': string
	}
}

export { }
