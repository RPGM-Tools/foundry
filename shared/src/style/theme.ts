import type { GlobalThemeOverrides } from 'naive-ui';
import { darkTheme, NConfigProvider } from 'naive-ui';
import type { App } from 'vue';

export const NaiveUIThemeOverrides = {
	common: {
		baseColor: '#ffffff',
		primaryColor: '#6633cc',
		primaryColorHover: '#855cd6',
		primaryColorPressed: '#5229a3',
		primaryColorSuppl: '#855cd6',
		actionColor: '#ff73c0',
		borderColor: '#fff',
		hoverColor: '#ff73c0',
		cardColor: 'rgba(24, 24, 28, 0.5)'
	},
	Typography: {
		textColorPrimary: '#855cd6'
	},
	Card: {
		borderRadius: '4px',
		paddingSmall: '4px',
		paddingMedium: '8px',
		paddingLarge: '12px',
		paddingHuge: '16px'
	},
	Tag: {
		border: '2'
	}
} as const satisfies GlobalThemeOverrides;

export const NaiveTheme = defineComponent({
	name: 'NaiveTheme',
	setup(_, { slots }) {
		return () => h(NConfigProvider, {
			themeOverrides: NaiveUIThemeOverrides,
			abstract: true,
			theme: darkTheme
		}, slots.default);
	}
});

import {
	NAvatar,
	NButton,
	NCard,
	NCollapse,
	NCollapseItem,
	NCollapseTransition,
	NEmpty,
	NFlex,
	NForm,
	NFormItemRow,
	NH1,
	NH2,
	NH3,
	NIcon,
	NInput,
	NList,
	NListItem,
	NP,
	NPopover,
	NResult,
	NSpin,
	NTab,
	NTabPane,
	NTabs,
	NTag,
	NText,
	NThing,
	NTooltip
} from 'naive-ui';

export type NaiveComponents = typeof NaiveComponents;

const NaiveComponents = {
	NAvatar,
	NButton,
	NCard,
	NCollapse,
	NCollapseItem,
	NCollapseTransition,
	NEmpty,
	NFlex,
	NForm,
	NFormItemRow,
	NH1,
	NH2,
	NH3,
	NIcon,
	NInput,
	NList,
	NListItem,
	NP,
	NPopover,
	NResult,
	NSpin,
	NTab,
	NTabPane,
	NTabs,
	NTag,
	NText,
	NThing,
	NTooltip
} as const;

export function globalNaive(app: App) {
	for (const [name, component] of Object.entries(NaiveComponents)) {
		app.component(name, component);
	}
	return app;
}
