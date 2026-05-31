/**
 * File: logger.ts
 * Purpose: Local logger implementation for the legacy Foundry runtime so the
 *          old Forge bridge can depend on local shared primitives instead of
 *          the legacy tools package root.
 * Last Updated: 2026-05-31
 */
import type { IRpgmModule } from '#/module';

type MessageParts = unknown[];

type RpgmLogging<
	T extends keyof RpgmLogger<never>,
	K extends keyof RpgmLogger<never>
> = Omit<RpgmLogger<T | K>, T | K>;

export class RpgmLogger<T extends keyof RpgmLogger<T> = never> {
	constructor(
		private _prefix = '',
		public options?: Partial<{
			show: (method: 'log' | 'warn' | 'error', message: string) => void;
		}>
	) {
		this._reset();
	}

	static fromModule(mod: IRpgmModule, options?: RpgmLogger['options']) {
		return new RpgmLogger(`${mod.icon} ${mod.name} | `, options);
	}

	private state = {
		visible: false,
		style: '',
		prefix: ''
	};

	get visible() {
		this.state.visible = true;
		return this as RpgmLogging<T, 'visible' | 'debug'>;
	}

	styled(style: string) {
		this.state.style = style;
		return this as RpgmLogging<T, 'styled'>;
	}

	prefixed(prefix: string) {
		this.state.prefix = prefix;
		return this as RpgmLogging<T, 'prefixed'>;
	}

	log(...messages: MessageParts) {
		this.state.style ||= 'color: #ad8cef; font-weight: bold;';
		this.send('log', ...messages);
	}

	warn(...messages: MessageParts) {
		this.state.style ||= 'color: #d47b4e; font-weight: bold;';
		this.send('warn', ...messages);
	}

	error(...messages: MessageParts) {
		this.state.style ||= 'color: #f46464; font-weight: bold;';
		this.send('error', ...messages);
	}

	debug(...messages: MessageParts) {
		this.state.style ||= 'color: #dddddd; font-weight: bold;';
		this.send('debug', ...messages);
	}

	private send(
		method: 'log' | 'warn' | 'error' | 'debug',
		...messages: MessageParts
	) {
		try {
			const { strings, objects } = messages.reduce<{
				strings: string[];
				objects: unknown[];
			}>(
				(accumulator, message) => {
					if (typeof message === 'string') {
						accumulator.strings.push(message);
					} else {
						accumulator.objects.push(message);
					}

					return accumulator;
				},
				{ strings: [], objects: [] }
			);

			const formattedMessage = `%c${this.state.prefix}${strings.join(' ')}`;
			console[method](formattedMessage, this.state.style, ...objects);

			if (this.options?.show && this.state.visible && method !== 'debug') {
				this.options.show(method, strings.join(' '));
			}

			this._reset();
		} catch (error) {
			this._reset();
			throw error;
		}
	}

	private _reset() {
		this.state = {
			prefix: this._prefix,
			visible: false,
			style: ''
		};
	}
}