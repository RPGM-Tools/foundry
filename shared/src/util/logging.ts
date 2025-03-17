/** Logs a message to the console */
export function log(...msgs: any[]) {
	_sendMessage("log", "color: #ad8cef; font-weight: bold;", ...msgs)
}

/** Logs a warning to the console */
export function warn(...args: any) {
	_sendMessage("warn", "color: #d47b4e; font-weight: bold;", ...args);
};

/** Logs an error to the console */
export function error(...args: any) {
	_sendMessage("error", "color: #f46464; font-weight: bold;", ...args);
};

/** Shows information in Foundry and logs to the console */
export function logU(...msgs: any[]) {
	_showNotification("log", msgs.join(' '))
	log(...msgs)
}

/** Shows a warning in Foundry and logs to the console */
export function warnU(...msgs: any[]) {
	_showNotification("warn", msgs.join(' '))
	warn(...msgs)
}

/** Shows an error in Foundry and logs to the console */
export function errorU(...msgs: any[]) {
	_showNotification("error", msgs.join(' '))
	error(...msgs)
}

export function logF(style: string, ...msgs: any[]) {
	_sendMessage("log", style, ...msgs)
}

export function warnF(style: string, ...msgs: any[]) {
	_sendMessage("warn", style, ...msgs)
}

export function errorF(style: string, ...msgs: any[]) {
	_sendMessage("error", style, ...msgs)
}

/**
 * Sends a formatted log message to the console.
 *
 * @param {"log"|"warn"|"error"} method - The console method.
 * @param {string} style - CSS style for the log message.
 * @param {...any} messages - The messages to log.
 * @private
 */
function _sendMessage(method: "log" | "warn" | "error", style: string, ...messages: any[]): void {
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
function _showNotification(method: "log" | "warn" | "error", formattedMessage: string) {
	if (!game.user.isGM) return;
	let uiMessage = formattedMessage.replace(/%c/g, "");
	const notificationMethod = method === "log" ? "info" : method;
	ui.notifications[notificationMethod](uiMessage, { console: false });
}
