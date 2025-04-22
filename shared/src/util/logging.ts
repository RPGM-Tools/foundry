export class RPGMLogger {
	/** Logs a message to the console */
	log(...msgs: any[]) {
		this.sendMessage("log", "color: #ad8cef; font-weight: bold;", ...msgs)
	}

	/** Logs a warning to the console */
	warn(...args: any) {
		this.sendMessage("warn", "color: #d47b4e; font-weight: bold;", ...args);
	};

	/** Logs an error to the console */
	error(...args: any) {
		this.sendMessage("error", "color: #f46464; font-weight: bold;", ...args);
	};

	debug(...args: any) {
		if (game.settings.get("rpgm-tools", "debug_mode"))
			this.sendMessage("log", "color: #dddddd; font-weight: bold;", ...args)
	}

	/** Shows information in Foundry and logs to the console */
	logU(...msgs: any[]) {
		this.showNotification("log", msgs.join(' '))
		this.log(...msgs)
	}

	/** Shows a warning in Foundry and logs to the console */
	warnU(...msgs: any[]) {
		this.showNotification("warn", msgs.join(' '))
		this.warn(...msgs)
	}

	/** Shows an error in Foundry and logs to the console */
	errorU(...msgs: any[]) {
		this.showNotification("error", msgs.join(' '))
		this.error(...msgs)
	}

	logF(style: string, ...msgs: any[]) {
		this.sendMessage("log", style, ...msgs)
	}

	warnF(style: string, ...msgs: any[]) {
		this.sendMessage("warn", style, ...msgs)
	}

	errorF(style: string, ...msgs: any[]) {
		this.sendMessage("error", style, ...msgs)
	}

	debugF(style: string, ...msgs: any[]) {
		if (game.settings.get("rpgm-tools", "debug_mode"))
			this.sendMessage("log", style, ...msgs)
	}

	/**
	 * Sends a formatted log message to the console.
	 *
	 * @param {"log"|"warn"|"error"} method - The console method.
	 * @param {string} style - CSS style for the log message.
	 * @param {...any} messages - The messages to log.
	 * @private
	 */
	private sendMessage(method: "log" | "warn" | "error", style: string, ...messages: any[]): void {
		const now = new Date();
		const timestamp = now.toISOString().split("T")[1].split(".")[0];
		const { strings, objects } = messages.reduce(
			(acc, msg) => {
				typeof msg === "string" ? acc.strings.push(msg) : acc.objects.push(msg);
				return acc;
			},
			{ strings: [], objects: [] }
		);
		const formattedMessage = `%c🎲📚 [${timestamp}] ${strings.join(" ")}`;
		console[method](formattedMessage, style, ...objects);
	}

	/**
	 * Displays a UI notification in Foundry if the current user is a GM.
	 *
	 * @param {"log"|"warn"|"error"} method - The log method.
	 * @param {string} formattedMessage - The message to display.
	 * @private
	 */
	private showNotification(method: "log" | "warn" | "error", formattedMessage: string) {
		if (!game.user.isGM) return;
		let uiMessage = formattedMessage.replace(/%c/g, "");
		const notificationMethod = method === "log" ? "info" : method;
		ui.notifications[notificationMethod](uiMessage, { console: false });
	}
}
