type Msg = unknown

/**
 * Logger with style and prefix capabilities
 */
export class RPGMLogger {
	constructor(private prefix: string) { }

	/**
	 * Logs a message to the console
	 * @param msgs - The message(s) to log
	 */
	log(...msgs: Msg[]) {
		this.sendMessage("log", "color: #ad8cef; font-weight: bold;", undefined, ...msgs);
	}

	/**
	 * Logs a warning to the console
	 * @param msgs - The message(s) to log
	 */
	warn(...msgs: Msg[]) {
		this.sendMessage("warn", "color: #d47b4e; font-weight: bold;", undefined, ...msgs);
	};

	/**
	 * Logs an error to the console
	 * @param msgs - The message(s) to log
	 */
	error(...msgs: Msg[]) {
		this.sendMessage("error", "color: #f46464; font-weight: bold;", undefined, ...msgs);
	};

	/**
	 * @param msgs - The message(s) to log
	 */
	debug(...msgs: Msg[]) {
		if (game.settings.get("rpgm-tools", "verbose-logs"))
			this.sendMessage("debug", "color: #dddddd; font-weight: bold;", undefined, ...msgs);
	}

	/**
	 * Shows information in Foundry and logs to the console
	 * @param msgs - The message(s) to log
	 */
	logU(...msgs: Msg[]) {
		this.showNotification("log", msgs.join(' '));
		this.log(...msgs);
	}

	/**
	 * Shows a warning in Foundry and logs to the console
	 * @param msgs - The message(s) to log
	 */
	warnU(...msgs: Msg[]) {
		this.showNotification("warn", msgs.join(' '));
		this.warn(...msgs);
	}

	/**
	 * Shows an error in Foundry and logs to the console
	 * @param msgs - The message(s) to log
	 */
	errorU(...msgs: Msg[]) {
		this.showNotification("error", msgs.join(' '));
		this.error(...msgs);
	}

	/**
	 * @param style - Style to use in the message
	 * @param prefix - Override the prefix, or undefined to not
	 * @param msgs - The message(s) to log
	 */
	logF(style: string, prefix: string | undefined, ...msgs: Msg[]) {
		this.sendMessage("log", style, prefix, ...msgs);
	}

	/**
	 * @param style - Style to use in the message
	 * @param prefix - Override the prefix, or undefined to not
	 * @param msgs - The message(s) to log
	 */
	warnF(style: string, prefix: string | undefined, ...msgs: Msg[]) {
		this.sendMessage("warn", style, prefix, ...msgs);
	}

	/**
	 * @param style - Style to use in the message
	 * @param prefix - Override the prefix, or undefined to not
	 * @param msgs - The message(s) to log
	 */
	errorF(style: string, prefix: string | undefined, ...msgs: Msg[]) {
		this.sendMessage("error", style, prefix, ...msgs);
	}

	/**
	 * @param style - Style to use in the message
	 * @param prefix - Override the prefix, or undefined to not
	 * @param msgs - The message(s) to log
	 */
	debugF(style: string, prefix: string | undefined, ...msgs: Msg[]) {
		if (game.settings.get("rpgm-tools", "verbose-logs"))
			this.sendMessage("debug", style, prefix, ...msgs);
	}

	/**
	 * Sends a formatted log message to the console.
	 * @param method - The console method.
	 * @param style - CSS style for the log message.
	 * @param prefix - The prefix to show before a message
	 * @param messages - The messages to log.
	 */
	private sendMessage(method: "log" | "warn" | "error" | "debug", style: string, prefix = `${this.prefix} | `, ...messages: Msg[]): void {
		const { strings, objects } = messages.reduce<{ strings: string[], objects: unknown[] }>(
			(acc, msg) => {
				if (typeof msg === "string")
					acc.strings.push(msg);
				else acc.objects.push(msg);
				return acc;
			},
			{ strings: [], objects: [] }
		);
		const formattedMessage = `%c${prefix}${strings.join(" ")}`;
		/* eslint-disable-next-line no-console */
		console[method](formattedMessage, style, ...objects);
	}

	/**
	 * Displays a UI notification in Foundry if the current user is a GM.
	 * @param method - The log method.
	 * @param formattedMessage - The message to display.
	 */
	private showNotification(method: "log" | "warn" | "error", formattedMessage: string) {
		if (!game.user.isGM) return;
		const uiMessage = formattedMessage.replace(/%c/g, "");
		const notificationMethod = method === "log" ? "info" : method;
		ui.notifications[notificationMethod](uiMessage, { console: false });
	}
}
