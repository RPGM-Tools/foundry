import { type App, type Component, createApp } from 'vue';

import { globalNaive } from '#/style/theme';

import SidebarApp from './SidebarApp';

declare class SidebarTab extends Application { }

declare global {
	interface Sidebar {
		activeTab: string;
		getData(options?: unknown): { tabs: Record<string, { tooltip: string; icon: string }> };
	}
}

export default class RpgmSidebar extends SidebarTab {
	app?: App;

	constructor(options: Partial<Application.Options>) {
		const getData = Sidebar.prototype.getData as (options: unknown) => {
			tabs: Record<string, {
				tooltip: string;
				icon: string;
			}>
		};
		Sidebar.prototype.getData = function(options = {}) {
			function insertKey<T>(key: string, value: T, obj: Record<string, T>) {
				// How many items to place after the tab button
				const LAST_INDEX = 1;
				const lastIndex = Object.keys(obj).length - LAST_INDEX;
				return Object.keys(obj).reduce((ac, a, i) => {
					if (i === lastIndex) ac[key] = value;
					ac[a] = obj[a];
					return ac;
				}, {} as Record<string, T>);
			}
			const data = getData(options);
			data.tabs = insertKey('rpgm', { tooltip: 'RPGM_TOOLS.SIDEBAR.TITLE', icon: 'rp-dice' }, data.tabs);
			return data;
		};
		super(options);
	}

	static override get defaultOptions(): Application.Options {
		return (foundry.utils.mergeObject(super.defaultOptions, {
			id: 'rpgm',
			height: 1,
			minimizable: false,
			title: 'RPGM Tools'
		} satisfies Partial<Application.Options>));
	};

	override async _renderInner(_data: ReturnType<typeof this['getData']>) {
		const data = _data as RenderData;

		const mount = document.createElement('section');

		mount.id = data.cssId;
		mount.dataset.tab = data.tabName;
		mount.className = data.cssClass ?? '';

		this.app = createApp(SidebarApp as Component);
		globalNaive(this.app);
		this.app.use(rpgm.sidebar.router);
		this.app.provide('onResize', this.onResize.bind(this));
		this.app.mount(mount);

		if (ui.sidebar?.activeTab === this.id) mount.classList.add('active');
		if (this.popOut) {
			mount.classList.remove('tab');
		} else {
			mount.classList.add('rpgm-app', 'static', 'directory');
		}

		return Promise.resolve($(mount));
	}

	override _injectHTML(html: JQuery) {
		$('body').append(html);
		this.onResize(true);
		this._element = html;
	}

	/** Max content of the sidebar, up to document height - padding. */
	private onResize(forceCenter = false) {
		void nextTick(() => {
			if (!this.popOut) return;
			const windowHeight = window.innerHeight;
			const maxHeight = Math.min(windowHeight, parseInt(this.element.css('max-height')) || 0);
			const headerHeight = this.element.find('.window-header').get(0)?.clientHeight ?? 0;
			const innerHeight = this.element.find('.sidebar-content').get(0)?.scrollHeight ?? 9999;

			const newHeight = Math.min(maxHeight, innerHeight + headerHeight + 47);
			const newTop = ((this.position.top ?? 0) + newHeight) > windowHeight || forceCenter ? (
				Math.max(0, Math.min(windowHeight - newHeight, (windowHeight - newHeight) / 2))
			) : this.position.top;
			this.element.css('height', `${newHeight}px`);
			this.element.css('top', `${newTop}px`);
			this.position = {
				...this.position,
				height: newHeight,
				top: newTop
			};
		});
	}

	protected override async _renderOuter(): Promise<JQuery> {
		const html = await super._renderOuter();
		html.addClass('rpgm-app');
		if (this.popOut) html.addClass('popout');
		return html;
	}

	override async close(options?: Application.CloseOptions): Promise<void> {
		this.element.addClass('closing');
		await new Promise(p => setTimeout(p, 200));
		return super.close(options);
	}

	static metadata = {
		name: 'RpgmSidebar'
	};
}
